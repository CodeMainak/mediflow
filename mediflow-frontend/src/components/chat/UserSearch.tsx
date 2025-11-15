import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Search, Loader2, MessageSquare } from 'lucide-react';
import { getDoctors } from '../../services/userService';
import { getPatients } from '../../services/userService';
import { getAppointments } from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface UserSearchProps {
  open: boolean;
  onClose: () => void;
  onSelectUser: (user: any) => void;
}

export const UserSearch: React.FC<UserSearchProps> = ({ open, onClose, onSelectUser }) => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let response;

      // Doctors can chat with patients, Patients can chat with doctors
      if (currentUser?.role?.toLowerCase() === 'doctor') {
        response = await getPatients();
        setUsers(response.data.data || []);
      } else if (currentUser?.role?.toLowerCase() === 'patient') {
        try {
          response = await getDoctors();
          const doctorsData = Array.isArray(response.data) ? response.data : [];
          setUsers(doctorsData);
        } catch (err: any) {
          // If admin endpoint fails for patient, try to get doctors from appointments
          const appointmentsRes = await getAppointments();
          const appointments = appointmentsRes.data || [];

          // Extract unique doctors from appointments
          const uniqueDoctorsMap = new Map();
          appointments.forEach((apt: any) => {
            const doctor = apt.doctorId;
            if (doctor && typeof doctor === 'object' && doctor._id) {
              uniqueDoctorsMap.set(doctor._id, doctor);
            }
          });

          setUsers(Array.from(uniqueDoctorsMap.values()));
        }
      }
    } catch (err) {
      toast.error('Failed to load users. You may need appointments with doctors first.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (user: any) => {
    onSelectUser(user);
    onClose();
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-emerald-900">
            <MessageSquare className="h-5 w-5 mr-2" />
            Start New Conversation
          </DialogTitle>
          <DialogDescription>
            Search for {currentUser?.role?.toLowerCase() === 'doctor' ? 'patients' : 'doctors'} to start chatting
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-emerald-200 focus:border-emerald-500"
          />
        </div>

        {/* User List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600">
                {searchTerm ? 'No users found matching your search' : 'No users available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors border border-transparent hover:border-emerald-200"
                >
                  <Avatar className="h-12 w-12 border border-gray-300">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">
                      {user.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{user.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          user.role?.toLowerCase() === 'doctor'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {user.role}
                      </Badge>
                      {user.specialization && (
                        <span className="text-xs text-gray-600">{user.specialization}</span>
                      )}
                    </div>
                    {user.email && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{user.email}</p>
                    )}
                  </div>

                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
