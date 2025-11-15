import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Droplet,
  AlertCircle,
  PhoneCall,
  Save,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../services/userService';
import { toast } from 'sonner';

export const ProfileSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [allergiesInput, setAllergiesInput] = useState('');
  const [showStickyButton, setShowStickyButton] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    allergies: [] as string[],
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
  });

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: (user as any).phone || '',
        address: (user as any).address || '',
        dateOfBirth: (user as any).dateOfBirth ? new Date((user as any).dateOfBirth).toISOString().split('T')[0] : '',
        gender: (user as any).gender || '',
        bloodGroup: (user as any).bloodGroup || '',
        allergies: (user as any).allergies || [],
        emergencyContact: (user as any).emergencyContact || {
          name: '',
          relationship: '',
          phone: '',
        },
      });
      setAllergiesInput((user as any).allergies?.join(', ') || '');
    }
  }, [user]);

  // Add scroll listener for sticky button
  useEffect(() => {
    const handleScroll = () => {
      // Show sticky button when scrolled down more than 300px
      setShowStickyButton(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [name]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleAllergiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAllergiesInput(value);
    // Convert comma-separated string to array
    const allergiesArray = value.split(',').map(a => a.trim()).filter(a => a);
    setFormData(prev => ({ ...prev, allergies: allergiesArray }));
    setHasChanges(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const response = await updateProfile(formData);
      toast.success('Profile updated successfully!');

      // Update user in context
      if (updateUser && response.data.user) {
        updateUser(response.data.user);
      }

      // Reset changes flag
      setHasChanges(false);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Safety check - if no user, show loading
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your personal information and health profile</p>
        </div>
        <Button
          onClick={() => handleSubmit()}
          disabled={loading || !hasChanges}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 hidden md:flex"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Unsaved changes indicator */}
      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            You have unsaved changes. Don't forget to save your profile updates.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center pt-4">
              <User className="h-5 w-5 mr-2 text-emerald-600" />
              Basic Information
            </CardTitle>
            <CardDescription>Your personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1-555-0123"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => { setFormData(prev => ({ ...prev, gender: value })); setHasChanges(true); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center mt-4">
              <Droplet className="h-5 w-5 mr-2 text-red-600" />
              Health Profile
            </CardTitle>
            <CardDescription>Critical medical information for emergency situations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select value={formData.bloodGroup} onValueChange={(value) => { setFormData(prev => ({ ...prev, bloodGroup: value })); setHasChanges(true); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {validBloodGroups.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Known Allergies</Label>
                <div className="relative">
                  <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500 pointer-events-none" />
                  <Input
                    id="allergies"
                    value={allergiesInput}
                    onChange={handleAllergiesChange}
                    placeholder="Penicillin, Shellfish, etc. (comma separated)"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">Separate multiple allergies with commas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center pt-4">
              <PhoneCall className="h-5 w-5 mr-2 text-green-600" />
              Emergency Contact
            </CardTitle>
            <CardDescription>Person to contact in case of emergency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  name="name"
                  value={formData.emergencyContact.name}
                  onChange={handleEmergencyContactChange}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                <Input
                  id="emergencyContactRelationship"
                  name="relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleEmergencyContactChange}
                  placeholder="Spouse, Parent, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="emergencyContactPhone"
                    name="phone"
                    type="tel"
                    value={formData.emergencyContact.phone}
                    onChange={handleEmergencyContactChange}
                    placeholder="+1-555-0203"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="outline"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-gray-300 px-8"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2 text-gray-300" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Sticky Save Settings Button - appears when scrolling */}
      {showStickyButton && hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 animate-in slide-in-from-bottom duration-300">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">
                You have unsaved changes
              </span>
            </div>
            <Button
              onClick={() => handleSubmit()}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
