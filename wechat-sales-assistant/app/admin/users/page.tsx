'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Key, 
  UserCheck, 
  UserX,
  Shield,
  ShieldCheck,
  Users as UsersIcon
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getUser, isAdmin, isSuperAdmin, type User, type UserRole } from "@/lib/auth"
import { userApi, type CreateUserRequest, type UpdateUserRequest } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface CreateUserForm {
  username: string
  phone: string
  password: string
  role: UserRole
  full_name?: string
  max_bot_count: number
}

interface EditUserForm {
  username: string
  phone: string
  role: UserRole
  is_active: boolean
  full_name?: string
  max_bot_count: number
}

interface ResetPasswordForm {
  new_password: string
  confirm_password: string
}

export default function UserManagementPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  
  // 对话框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  
  // 表单状态
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    username: '',
    phone: '',
    password: '',
    role: 'user',
    full_name: '',
    max_bot_count: 1
  })
  
  const [editForm, setEditForm] = useState<EditUserForm>({
    username: '',
    phone: '',
    role: 'user',
    is_active: true,
    full_name: '',
    max_bot_count: 1
  })
  
  const [resetPasswordForm, setResetPasswordForm] = useState<ResetPasswordForm>({
    new_password: '',
    confirm_password: ''
  })
  
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const router = useRouter()

  // 加载用户列表
  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await userApi.list(0, 1000) // 获取所有用户
      setUsers(response.data)
    } catch (error) {
      console.error('加载用户列表失败:', error)
      toast.error(error instanceof Error ? error.message : '加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initializePage = async () => {
      const user = getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      if (!isAdmin()) {
        router.push('/dashboard')
        return
      }
      
      setCurrentUser(user)
      await loadUsers()
    }

    initializePage()
  }, [router])

  // 搜索过滤
  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  // 添加测试用户创建的调试函数
  const testCreateUser = async () => {
    console.log('=== 开始测试用户创建 ===')
    console.log('当前用户:', currentUser)
    console.log('表单数据:', createForm)
    
    const testUserData = {
      username: `test_${Date.now()}`,
      phone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      password: 'password123',
      role: 'user' as UserRole,
      full_name: '测试用户',
      max_bot_count: 1
    }
    
    console.log('测试用户数据:', testUserData)
    
    try {
      const result = await userApi.create(testUserData)
      console.log('创建成功:', result)
      toast.success('测试用户创建成功')
      await loadUsers()
    } catch (error) {
      console.error('测试创建失败:', error)
      toast.error(`测试失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 创建用户
  const handleCreateUser = async () => {
    // 基本字段验证
    if (!createForm.username || !createForm.phone || !createForm.password) {
      toast.error('请填写所有必填字段')
      return
    }

    // 用户名格式验证
    if (createForm.username.length < 3 || createForm.username.length > 50) {
      toast.error('用户名长度必须在3-50字符之间')
      return
    }

    // 手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(createForm.phone)) {
      toast.error('请输入有效的手机号码')
      return
    }

    // 密码长度验证
    if (createForm.password.length < 8 || createForm.password.length > 40) {
      toast.error('密码长度必须在8-40字符之间')
      return
    }

    // 检查权限
    if (!currentUser) return
    
    if (currentUser.role === 'admin' && createForm.role !== 'user') {
      toast.error('普通管理员只能创建普通用户')
      return
    }

    try {
      // 清理和格式化数据
      const userData: CreateUserRequest = {
        username: createForm.username.trim(),
        phone: createForm.phone.trim(),
        password: createForm.password,
        role: createForm.role,
        full_name: createForm.full_name?.trim() || undefined,
        max_bot_count: createForm.max_bot_count
      }

      console.log('即将创建用户，数据:', userData)

      await userApi.create(userData)
      toast.success('用户创建成功')
      
      // 重新加载用户列表
      await loadUsers()
      
      // 重置表单并关闭对话框
      setCreateForm({
        username: '',
        phone: '',
        password: '',
        role: 'user',
        full_name: '',
        max_bot_count: 1
      })
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('创建用户失败:', error)
      toast.error(error instanceof Error ? error.message : '创建用户失败')
    }
  }

  // 更新用户
  const handleUpdateUser = async () => {
    if (!editForm.username || !editForm.phone) {
      toast.error('请填写所有必填字段')
      return
    }

    // 手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(editForm.phone)) {
      toast.error('请输入有效的手机号码')
      return
    }

    try {
      const userData: UpdateUserRequest = {
        username: editForm.username,
        phone: editForm.phone,
        role: editForm.role,
        is_active: editForm.is_active,
        full_name: editForm.full_name || undefined,
        max_bot_count: editForm.max_bot_count
      }

      await userApi.update(selectedUserId, userData)
      toast.success('用户信息更新成功')
      
      // 重新加载用户列表
      await loadUsers()
      
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('更新用户失败:', error)
      toast.error(error instanceof Error ? error.message : '更新用户失败')
    }
  }

  // 切换用户状态
  const handleToggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      await userApi.update(userId, { is_active: !user.is_active })
      toast.success('用户状态已更新')
      
      // 重新加载用户列表
      await loadUsers()
    } catch (error) {
      console.error('更新用户状态失败:', error)
      toast.error(error instanceof Error ? error.message : '更新用户状态失败')
    }
  }

  // 删除用户
  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error('不能删除自己的账户')
      return
    }
    
    if (!confirm('确定要删除这个用户吗？此操作不可撤销。')) {
      return
    }

    try {
      await userApi.delete(userId)
      toast.success('用户已删除')
      
      // 重新加载用户列表
      await loadUsers()
    } catch (error) {
      console.error('删除用户失败:', error)
      toast.error(error instanceof Error ? error.message : '删除用户失败')
    }
  }

  // 重置密码
  const handleResetPassword = async () => {
    if (!resetPasswordForm.new_password || !resetPasswordForm.confirm_password) {
      toast.error('请填写新密码和确认密码')
      return
    }

    if (resetPasswordForm.new_password !== resetPasswordForm.confirm_password) {
      toast.error('两次输入的密码不一致')
      return
    }

    if (resetPasswordForm.new_password.length < 8) {
      toast.error('密码长度至少8位')
      return
    }

    try {
      await userApi.resetPassword(selectedUserId, resetPasswordForm.new_password)
      toast.success('密码重置成功')
      
      setResetPasswordForm({ new_password: '', confirm_password: '' })
      setIsResetPasswordDialogOpen(false)
    } catch (error) {
      console.error('重置密码失败:', error)
      toast.error(error instanceof Error ? error.message : '重置密码失败')
    }
  }

  // 打开编辑对话框
  const openEditDialog = (user: User) => {
    setSelectedUserId(user.id)
    setEditForm({
      username: user.username,
      phone: user.phone || '',
      role: user.role,
      is_active: user.is_active,
      full_name: user.full_name || '',
      max_bot_count: user.max_bot_count || 1
    })
    setIsEditDialogOpen(true)
  }

  // 打开重置密码对话框
  const openResetPasswordDialog = (user: User) => {
    setSelectedUserId(user.id)
    setResetPasswordForm({ new_password: '', confirm_password: '' })
    setIsResetPasswordDialogOpen(true)
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200"><ShieldCheck className="w-3 h-3 mr-1" />超级管理员</Badge>
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200"><Shield className="w-3 h-3 mr-1" />管理员</Badge>
      case 'user':
        return <Badge variant="secondary"><UsersIcon className="w-3 h-3 mr-1" />用户</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const canManageUser = (targetUser: User) => {
    if (!currentUser) return false
    
    // 超级管理员可以管理所有人（除了删除自己）
    if (isSuperAdmin()) {
      return true
    }
    
    // 普通管理员只能管理普通用户
    if (currentUser.role === 'admin') {
      return targetUser.role === 'user'
    }
    
    return false
  }

  const getAvailableRoles = (): { value: UserRole; label: string }[] => {
    if (isSuperAdmin()) {
      return [
        { value: 'user', label: '用户' },
        { value: 'admin', label: '管理员' },
        { value: 'super_admin', label: '超级管理员' }
      ]
    } else {
      return [{ value: 'user', label: '用户' }]
    }
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">用户管理</h2>
          <p className="text-muted-foreground text-sm">
            管理系统用户账户和权限
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* 测试按钮 */}
          <Button variant="outline" onClick={testCreateUser}>
            测试创建
          </Button>
          
          {/* 创建用户对话框 */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建用户
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新用户</DialogTitle>
              <DialogDescription>
                填写用户信息创建新账户
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  value={createForm.username}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="请输入用户名"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="phone">手机号码</Label>
                <Input
                  id="phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="请输入手机号码"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="full_name">姓名</Label>
                <Input
                  id="full_name"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="请输入姓名（可选）"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="password">初始密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="请输入初始密码（至少8位）"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="role">角色</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, role: value as UserRole }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择用户角色" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles().map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="max_bot_count">最大机器人数量</Label>
                <Input
                  id="max_bot_count"
                  type="number"
                  min="0"
                  value={createForm.max_bot_count}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, max_bot_count: parseInt(e.target.value) || 1 }))}
                  placeholder="可创建的最大机器人数量"
                />
                <p className="text-sm text-muted-foreground">限制该用户可以创建的微信机器人数量</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateUser}>
                创建用户
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* 编辑用户对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户信息</DialogTitle>
            <DialogDescription>
              修改用户基本信息
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_username">用户名</Label>
              <Input
                id="edit_username"
                value={editForm.username}
                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="请输入用户名"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit_phone">手机号码</Label>
              <Input
                id="edit_phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="请输入手机号码"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit_full_name">姓名</Label>
              <Input
                id="edit_full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="请输入姓名（可选）"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit_role">角色</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value as UserRole }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择用户角色" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="edit_is_active">账户激活状态</Label>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit_max_bot_count">最大机器人数量</Label>
              <Input
                id="edit_max_bot_count"
                type="number"
                min="0"
                value={editForm.max_bot_count}
                onChange={(e) => setEditForm(prev => ({ ...prev, max_bot_count: parseInt(e.target.value) || 1 }))}
                placeholder="可创建的最大机器人数量"
              />
              <p className="text-sm text-muted-foreground">限制该用户可以创建的微信机器人数量</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateUser}>
              保存更改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码对话框 */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置用户密码</DialogTitle>
            <DialogDescription>
              为用户设置新的登录密码
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new_password">新密码</Label>
              <Input
                id="new_password"
                type="password"
                value={resetPasswordForm.new_password}
                onChange={(e) => setResetPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                placeholder="请输入新密码（至少8位）"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="confirm_password">确认密码</Label>
              <Input
                id="confirm_password"
                type="password"
                value={resetPasswordForm.confirm_password}
                onChange={(e) => setResetPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                placeholder="请再次输入新密码"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleResetPassword}>
              重置密码
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 搜索和过滤 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索用户名或姓名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">加载中...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>手机号码</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>机器人限制</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      暂无用户数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{user.full_name || '-'}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.max_bot_count || 1} 个
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            <UserCheck className="w-3 h-3 mr-1" />
                            正常
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                            <UserX className="w-3 h-3 mr-1" />
                            禁用
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        {canManageUser(user) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                编辑信息
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openResetPasswordDialog(user)}>
                                <Key className="h-4 w-4 mr-2" />
                                重置密码
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id)}>
                                {user.is_active ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    禁用账户
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    启用账户
                                  </>
                                )}
                              </DropdownMenuItem>
                              {user.id !== currentUser.id && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  删除用户
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 