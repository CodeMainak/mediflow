import React, { useState } from 'react';
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
import { Loader2, User, Mail, Phone, MapPin, Lock, Calendar, Users, Heart, AlertCircle } from 'lucide-react';
import api from '../../services/api';

interface AddPatientFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddPatientForm: React.FC<AddPatientFormProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    bloodGroup: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    role: 'Patient',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other'];
  const relationships = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload: Record<string, any> = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        role: 'Patient',
        ...(formData.address && { address: formData.address }),
        ...(formData.bloodGroup && { bloodGroup: formData.bloodGroup }),
        ...(formData.allergies && {
          allergies: formData.allergies.split(',').map(a => a.trim()).filter(Boolean),
        }),
      };

      if (formData.emergencyContactName || formData.emergencyContactPhone) {
        payload.emergencyContact = {
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRelationship || 'Other',
          phone: formData.emergencyContactPhone,
        };
      }

      await api.post('/api/admin/users', payload);
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to add patient';
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2 text-emerald-600" />
            Basic Information
          </CardTitle>
          <CardDescription>Enter the patient's personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange}
                  placeholder="John Doe" className="pl-10" disabled={loading} />
              </div>
              {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange}
                  placeholder="john.doe@example.com" className="pl-10" disabled={loading} />
              </div>
              {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange}
                  placeholder="Minimum 6 characters" className="pl-10" disabled={loading} />
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange}
                  placeholder="+91 98765 43210" className="pl-10" disabled={loading} />
              </div>
              {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth}
                  onChange={handleInputChange} className="pl-10" disabled={loading} />
              </div>
              {errors.dateOfBirth && <p className="text-xs text-red-600">{errors.dateOfBirth}</p>}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(v) => {
                setFormData(prev => ({ ...prev, gender: v }));
                if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
              }} disabled={loading}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  {genders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-xs text-red-600">{errors.gender}</p>}
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="address" name="address" value={formData.address} onChange={handleInputChange}
                  placeholder="123 Main Street, City, State" className="pl-10" disabled={loading} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="h-5 w-5 mr-2 text-emerald-600" />
            Health Profile
          </CardTitle>
          <CardDescription>Medical details (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Blood Group */}
            <div className="space-y-2">
              <Label>Blood Group</Label>
              <Select value={formData.bloodGroup} onValueChange={(v) =>
                setFormData(prev => ({ ...prev, bloodGroup: v }))} disabled={loading}>
                <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                <SelectContent>
                  {bloodGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <div className="relative">
                <AlertCircle className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="allergies" name="allergies" value={formData.allergies} onChange={handleInputChange}
                  placeholder="Penicillin, Peanuts (comma-separated)" className="pl-10" disabled={loading} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-emerald-600" />
            Emergency Contact
          </CardTitle>
          <CardDescription>Contact in case of emergency (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Contact Name */}
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Contact Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="emergencyContactName" name="emergencyContactName"
                  value={formData.emergencyContactName} onChange={handleInputChange}
                  placeholder="Jane Doe" className="pl-10" disabled={loading} />
              </div>
            </div>

            {/* Relationship */}
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select value={formData.emergencyContactRelationship} onValueChange={(v) =>
                setFormData(prev => ({ ...prev, emergencyContactRelationship: v }))} disabled={loading}>
                <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                <SelectContent>
                  {relationships.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Phone */}
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="emergencyContactPhone" name="emergencyContactPhone"
                  type="tel" value={formData.emergencyContactPhone} onChange={handleInputChange}
                  placeholder="+91 98765 43210" className="pl-10" disabled={loading} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit error */}
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding Patient...</>
          ) : (
            <><User className="h-4 w-4 mr-2" />Add Patient</>
          )}
        </Button>
      </div>
    </form>
  );
};
