import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import styles from '../styles/changePassword.module.css'
import toast, { Toaster } from 'react-hot-toast'

const ChangePassword = () => {
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting }
    } = useForm()

    const newPassword = watch('newPassword')

    const onSubmit = async (data) => {
        try {
            const token = localStorage.getItem('token')

            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/auth/change-password`,
                {
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            toast.success(response.data.message || 'Password changed successfully!')
            reset()

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                navigate('/dashboard/admin')
            }, 2000)

        } catch (error) {
            console.error('Password change error:', error)
            const errorMessage = error.response?.data?.message || 'Failed to change password. Please try again.'
            toast.error(errorMessage)
        }
    }

    return (
        <div className={styles.changePasswordContainer}>
            <Toaster position="top-right" />
            <Navbar />

            <div className={styles.changePasswordContent}>
                <div className="container">
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); navigate('/dashboard/admin') }}
                        className={styles.backButton}
                    >
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </a>

                    <h2 className={styles.pageTitle}>Change Password</h2>

                    <div className={styles.formCard}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            {/* Current Password */}
                            <div className={styles.formGroup}>
                                <label htmlFor="currentPassword" className={styles.formLabel}>
                                    Current Password
                                </label>
                                <input
                                    id="currentPassword"
                                    type="password"
                                    className={`${styles.formInput} ${errors.currentPassword ? styles.error : ''}`}
                                    placeholder="Enter current password"
                                    {...register('currentPassword', {
                                        required: 'Current password is required'
                                    })}
                                />
                                {errors.currentPassword && (
                                    <div className={styles.errorMessage}>
                                        <AlertCircle size={14} />
                                        {errors.currentPassword.message}
                                    </div>
                                )}
                            </div>

                            {/* New Password */}
                            <div className={styles.formGroup}>
                                <label htmlFor="newPassword" className={styles.formLabel}>
                                    New Password
                                </label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    className={`${styles.formInput} ${errors.newPassword ? styles.error : ''}`}
                                    placeholder="Enter new password"
                                    {...register('newPassword', {
                                        required: 'New password is required',
                                        minLength: {
                                            value: 6,
                                            message: 'Password must be at least 6 characters'
                                        }
                                    })}
                                />
                                {errors.newPassword && (
                                    <div className={styles.errorMessage}>
                                        <AlertCircle size={14} />
                                        {errors.newPassword.message}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className={styles.formGroup}>
                                <label htmlFor="confirmPassword" className={styles.formLabel}>
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    className={`${styles.formInput} ${errors.confirmPassword ? styles.error : ''}`}
                                    placeholder="Confirm new password"
                                    {...register('confirmPassword', {
                                        required: 'Please confirm your password',
                                        validate: value =>
                                            value === newPassword || 'Passwords do not match'
                                    })}
                                />
                                {errors.confirmPassword && (
                                    <div className={styles.errorMessage}>
                                        <AlertCircle size={14} />
                                        {errors.confirmPassword.message}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Changing Password...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChangePassword
