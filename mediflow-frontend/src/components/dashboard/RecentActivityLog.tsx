import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Calendar,
  Pill,
  Clock,
  Activity as ActivityIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'appointment' | 'prescription';
  action: string;
  description: string;
  date: string;
  status: string;
  icon: string;
  color: string;
}

interface RecentActivityLogProps {
  activities: Activity[];
  loading?: boolean;
}

export const RecentActivityLog: React.FC<RecentActivityLogProps> = ({ activities, loading }) => {
  const getIcon = (iconType: string, color: string) => {
    const iconClass = `h-5 w-5 ${color}`;
    switch (iconType) {
      case 'calendar':
        return <Calendar className={iconClass} />;
      case 'pill':
        return <Pill className={iconClass} />;
      default:
        return <ActivityIcon className={iconClass} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      if (diffInHours < 1) {
        const minutes = Math.floor(diffInMs / (1000 * 60));
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
      } else if (diffInHours < 24) {
        const hours = Math.floor(diffInHours);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
      } else if (diffInDays < 7) {
        const days = Math.floor(diffInDays);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <Card className="border-indigo-200 shadow-xl bg-white">
        <CardHeader className="bg-indigo-50 border-b border-indigo-100 p-4">
          <CardTitle className="flex items-center text-xl font-bold text-indigo-800">
            <ActivityIcon className="h-6 w-6 text-indigo-600 mr-3" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-sm text-indigo-700">
            Your latest health activities and updates
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-200 shadow-xl bg-white">
      <CardHeader className="bg-indigo-50 border-b border-indigo-100 p-4">
        <CardTitle className="flex items-center text-xl font-bold text-indigo-800">
          <ActivityIcon className="h-6 w-6 text-indigo-600 mr-3" />
          Recent Activity
        </CardTitle>
        <CardDescription className="text-sm text-indigo-700">
          Your latest health activities and updates
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {activities.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-indigo-300 rounded-lg bg-indigo-50/50 py-4">
            <ActivityIcon className="mx-auto h-12 w-12 text-indigo-500 mb-4" />
            <p className="text-indigo-800 font-medium text-lg">No recent activity</p>
            <p className="text-sm text-indigo-600 mt-2">Your activities will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {activities.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-white hover:bg-indigo-50 transition-colors shadow-sm"
              >
                {/* Icon */}
                <div className="flex-shrink-0 mr-3">
                  {getIcon(activity.icon, activity.color)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900">
                      {activity.action}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0 self-center">
                  <Badge
                    variant="outline"
                    className={`text-xs whitespace-nowrap ${activity.status === 'confirmed' || activity.status === 'completed'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : activity.status === 'pending'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : activity.status === 'cancelled'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-gray-200 bg-gray-50 text-gray-700'
                      }`}
                  >
                    {getStatusIcon(activity.status)}
                    {activity.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
