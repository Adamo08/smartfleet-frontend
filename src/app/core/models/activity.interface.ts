export interface ActivityItem {
  id: number;
  activityType: string;
  title: string;
  description: string;
  userName: string;
  userId?: number;
  relatedEntityType?: string;
  relatedEntityId?: number;
  metadata?: string;
  createdAt: Date;
  iconColor: string;
  displayName: string;
}

export interface RecentActivities {
  activities: ActivityItem[];
}

export interface ActivityStats {
  [key: string]: number;
}
