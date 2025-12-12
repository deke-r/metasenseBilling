import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import styles from '../styles/login.module.css'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'

const VerifyOTP = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const email = location.state?.email
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const inputRefs = useRef([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (!email) {
            navigate('/')
        }
    }, [email, navigate])

    const handleChange = (index, value) => {
        if (isNaN(value)) return

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        // Auto move to next input
        if (value !== '' && index < 5) {
            inputRefs.current[index + 1].focus()
        }
    }

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('')
        if (pastedData.every(char => !isNaN(char))) {
            const newOtp = [...otp]
            pastedData.forEach((val, i) => {
                if (i < 6) newOtp[i] = val
            })
            setOtp(newOtp)
            // Focus last filled or first empty
            const focusIndex = Math.min(pastedData.length, 5)
            inputRefs.current[focusIndex].focus()
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const otpString = otp.join('')
        if (otpString.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/auth/verify-otp`, {
                email,
                otp: otpString
            })

            const resetToken = res.data.resetToken
            toast.success('OTP Verified!')

            setTimeout(() => {
                navigate('/reset-password', {
                    state: {
                        email,
                        resetToken
                    }
                })
            }, 1000)

        } catch (error) {
            console.error('Verify OTP error:', error)
            const errorMessage = error.response?.data?.message || 'Invalid OTP'
            toast.error(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleResendOTP = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_BASE_URL}/auth/request-otp`, { email })
            toast.success('New OTP sent!')
            setOtp(['', '', '', '', '', ''])
            inputRefs.current[0].focus()
        } catch (error) {
            toast.error('Failed to resend OTP')
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
                                    onClick={() => navigate('/forgot-password')}
                                    className="btn btn-link p-0 text-decoration-none text-muted d-flex align-items-center"
                                >
                                    <ArrowLeft size={16} className="me-1" /> Back
                                </button>
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <img src="/img/logo.png" alt="Logo" className={styles.loginLogo} />
                            </div>

                            <h1 className={styles.loginTitle}>Verify OTP</h1>
                            <p className={styles.loginSubtitle}>
                                Enter the 6-digit code sent to<br /><strong>{email}</strong>
                            </p>

                            <form onSubmit={handleSubmit}>
                                <div className="d-flex justify-content-center gap-2 mb-4">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={el => inputRefs.current[index] = el}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            onPaste={index === 0 ? handlePaste : undefined}
                                            className={styles.formInput}
                                            style={{
                                                width: '45px',
                                                height: '45px',
                                                textAlign: 'center',
                                                fontSize: '1.2rem',
                                                padding: '0'
                                            }}
                                        />
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                                </button>

                                <div className="text-center mt-3">
                                    <p className="text-muted small mb-0">
                                        Didn't receive code? {' '}
                                        <button
                                            type="button"
                                            onClick={handleResendOTP}
                                            className="btn btn-link p-0 text-decoration-none"
                                            style={{ color: '#0C4379', fontWeight: '500' }}
                                        >
                                            Resend
                                        </button>
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VerifyOTP
