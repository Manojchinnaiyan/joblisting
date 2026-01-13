import { useMutation } from '@tanstack/react-query'
import { accountApi, ChangePasswordRequest, SetPasswordRequest, DeleteAccountRequest } from '@/lib/api/account'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => accountApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password')
    },
  })
}

export function useSetPassword() {
  return useMutation({
    mutationFn: (data: SetPasswordRequest) => accountApi.setPassword(data),
    onSuccess: () => {
      toast.success('Password set successfully! You can now login with your email and password.')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set password')
    },
  })
}

export function useDeleteAccount() {
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)

  return useMutation({
    mutationFn: (data: DeleteAccountRequest) => accountApi.deleteAccount(data),
    onSuccess: () => {
      logout()
      toast.success('Account deleted successfully')
      router.push('/')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete account')
    },
  })
}
