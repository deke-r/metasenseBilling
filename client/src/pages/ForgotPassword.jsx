import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react'
import styles from '../styles/login.module.css'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'

const ForgotPassword = () => {
    const navigate = useNavigate()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm()

    const onSubmit = async (data) => {
        try {
            await axios.post(`${import.meta.env.VITE_BASE_URL}/auth/request-otp`, data)
            toast.success('OTP sent to your email!')
            // Navigate to verify page with email state
            setTimeout(() => {
                navigate('/verify-otp', { state: { email: data.email } })
            }, 1000)
        } catch (error) {
            console.error('Request OTP error:', error)
            const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.'
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
                            <div className="mb-4">
                                <button
                                    onClick={() => navigate('/')}
                                    className="btn btn-link p-0 text-decoration-none text-muted d-flex align-items-center"
                                >
                                    <ArrowLeft size={16} className="me-1" /> Back to Login
                                </button>
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <img src="/img/logo.png" alt="Logo" className={styles.loginLogo} />
                            </div>

                            <h1 className={styles.loginTitle}>Forgot Password?</h1>
                            <p className={styles.loginSubtitle}>Enter your email to receive a password reset OTP</p>

                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="email" className={styles.formLabel}>
                                        Email Address
                                    </label>
                                    <div className={styles.inputWrapper}>
                                        <Mail className={styles.inputIcon} size={18} />
                                        <input
                                            id="email"
                                            type="email"
                                            className={`${styles.formInput} ${styles.inputWithIcon} ${errors.email ? styles.error : ''}`}
                                            placeholder="Enter your email"
                                            {...register('email', {
                                                required: 'Email is required',
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: 'Invalid email address'
                                                }
                                            })}
                                        />
                                    </div>
                                    {errors.email && (
                                        <div className={styles.errorMessage}>
                                            <AlertCircle size={14} />
                                            <span>{errors.email.message}</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword
