import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import styles from '../styles/login.module.css'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import { useNavigate } from 'react-router-dom'
import { isTokenValid } from '../utils/auth'
import toast, { Toaster } from 'react-hot-toast'

const Login = () => {
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm()

    useEffect(() => {
        if (isTokenValid()) {
            const role = jwtDecode(localStorage.getItem('token')).role
            if (role === 'admin') {
                navigate('/dashboard/admin', { replace: true })
            }

        }
    }, [navigate])

    const onSubmit = async (data) => {
        try {
            console.log('Login data:', data)

            const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/auth/login`, data)

            console.log(res)

            const token = res.data.token
            localStorage.setItem('token', token);

            const decodedToken = jwtDecode(token)
            const role = decodedToken.role

            if (role === 'admin') {
                navigate('/dashboard/admin')
            }

        } catch (error) {
            console.error('Login error:', error)
            const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials and try again.'
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
                            <h1 className={styles.loginTitle}>Welcome Back</h1>
                            <p className={styles.loginSubtitle}>Sign in to your account</p>

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

                                <div className={styles.formGroup}>
                                    <label htmlFor="password" className={styles.formLabel}>
                                        Password
                                    </label>
                                    <div className={styles.inputWrapper}>
                                        <Lock className={styles.inputIcon} size={18} />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            className={`${styles.formInput} ${styles.inputWithIcon} ${errors.password ? styles.error : ''}`}
                                            placeholder="Enter your password"
                                            style={{ paddingRight: '3rem' }}
                                            {...register('password', {
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
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <div className={styles.errorMessage}>
                                            <AlertCircle size={14} />
                                            <span>{errors.password.message}</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login