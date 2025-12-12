import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import styles from '../styles/login.module.css'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'

const ResetPassword = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const resetToken = location.state?.resetToken

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting }
    } = useForm()

    useEffect(() => {
        if (!resetToken) {
            navigate('/')
        }
    }, [resetToken, navigate])

    const onSubmit = async (data) => {
        try {
            await axios.post(
                `${import.meta.env.VITE_BASE_URL}/auth/reset-password`,
                { newPassword: data.newPassword },
                {
                    headers: { 'Authorization': `Bearer ${resetToken}` }
                }
            )

            toast.success('Password reset successfully!')

            setTimeout(() => {
                navigate('/')
            }, 2000)

        } catch (error) {
            console.error('Reset password error:', error)
            const errorMessage = error.response?.data?.message || 'Failed to reset password'
            toast.error(errorMessage)
        }
    }

    return (
        <div className={styles.loginContainer}>
            <Toaster position="top-right" />
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
                        <div className={styles.loginCard}>
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <img src="/img/logo.png" alt="Logo" className={styles.loginLogo} />
                            </div>

                            <h1 className={styles.loginTitle}>Reset Password</h1>
                            <p className={styles.loginSubtitle}>Create a new strong password</p>

                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="newPassword" className={styles.formLabel}>
                                        New Password
                                    </label>
                                    <div className={styles.inputWrapper}>
                                        <Lock className={styles.inputIcon} size={18} />
                                        <input
                                            id="newPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            className={`${styles.formInput} ${styles.inputWithIcon} ${errors.newPassword ? styles.error : ''}`}
                                            placeholder="Enter new password"
                                            style={{ paddingRight: '3rem' }}
                                            {...register('newPassword', {
                                                required: 'Password is required',
                                                minLength: {
                                                    value: 6,
                                                    message: 'Password must be at least 6 characters'
                                                }
                                            })}
                                        />
                                        <button
                                            type="button"
                                            className={styles.eyeButton}
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.newPassword && (
                                        <div className={styles.errorMessage}>
                                            <AlertCircle size={14} />
                                            <span>{errors.newPassword.message}</span>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="confirmPassword" className={styles.formLabel}>
                                        Confirm Password
                                    </label>
                                    <div className={styles.inputWrapper}>
                                        <Lock className={styles.inputIcon} size={18} />
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            className={`${styles.formInput} ${styles.inputWithIcon} ${errors.confirmPassword ? styles.error : ''}`}
                                            placeholder="Confirm new password"
                                            style={{ paddingRight: '3rem' }}
                                            {...register('confirmPassword', {
                                                required: 'Please confirm your password',
                                                validate: (val) => {
                                                    if (watch('newPassword') != val) {
                                                        return "Your passwords do mean match"
                                                    }
                                                }
                                            })}
                                        />
                                        <button
                                            type="button"
                                            className={styles.eyeButton}
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <div className={styles.errorMessage}>
                                            <AlertCircle size={14} />
                                            <span>{errors.confirmPassword.message}</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ResetPassword
