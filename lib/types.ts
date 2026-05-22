export type Role = 'member' | 'social_chair' | 'rush_chair' | 'exec'

export interface Profile {
  id: string
  user_id: string | null
  email: string
  full_name: string | null
  role: Role
  avatar_url: string | null
  phone: string | null
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  created_by: string | null
  created_at: string
  author?: Pick<Profile, 'full_name' | 'email'>
}

export interface AnnouncementComment {
  id: string
  announcement_id: string
  content: string
  created_by: string | null
  created_at: string
  author?: Pick<Profile, 'full_name' | 'email'>
}

export interface Event {
  id: string
  title: string
  description: string | null
  location: string | null
  start_time: string
  end_time: string | null
  created_by: string | null
  created_at: string
}

export type TaskStatus = 'pending' | 'in_progress' | 'complete'

export interface Task {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  created_by: string | null
  status: TaskStatus
  due_date: string | null
  created_at: string
  assignee?: Pick<Profile, 'full_name' | 'email'>
}

export type PointRequestStatus = 'pending' | 'approved' | 'denied'

export interface HousePointRequest {
  id: string
  member_id: string
  description: string
  image_url: string | null
  points_requested: number
  points_awarded: number | null
  status: PointRequestStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  member?: Pick<Profile, 'full_name' | 'email'>
}

export interface Due {
  id: string
  member_id: string
  amount: number
  due_date: string
  paid: boolean
  paid_date: string | null
  semester: string
  created_at: string
  member?: Pick<Profile, 'full_name' | 'email'>
}

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  date: string
  created_by: string | null
  created_at: string
}

export type FinancialRequestStatus = 'pending' | 'approved' | 'denied'

export interface FinancialRequest {
  id: string
  submitted_by: string | null
  amount: number
  reason: string
  status: FinancialRequestStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  submitter?: Pick<Profile, 'full_name' | 'email'>
}

export type ProspectStatus = 'prospect' | 'invited' | 'bid' | 'pledge' | 'member'

export interface RushProspect {
  id: string
  name: string
  photo_url: string | null
  email: string | null
  phone: string | null
  notes: string | null
  status: ProspectStatus
  created_by: string | null
  created_at: string
}

export interface Document {
  id: string
  title: string
  file_url: string
  file_name: string
  file_size: number | null
  category: string | null
  uploaded_by: string | null
  created_at: string
  uploader?: Pick<Profile, 'full_name' | 'email'>
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  created_at: string
}
