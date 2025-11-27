import Navbar from '../components/Navbar'
import styles from '../styles/dashboard.module.css'
import { FileText, Plus } from 'lucide-react'

const Invoice = () => {
    return (
        <div className={styles.dashboardContainer}>
            <Navbar />

            <div className={styles.mainContent}>
                <div className="container">
                    <h2 className={styles.pageTitle}>Generate Invoice</h2>

                    <div style={{
                        background: '#ffffff',
                        padding: '3rem',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                        border: '1px solid #f3f4f6',
                        textAlign: 'center'
                    }}>
                        <FileText size={64} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
                        <h3 style={{ color: '#1f2937', fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                            Invoice Generation
                        </h3>
                        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '2rem' }}>
                            Invoice form will be implemented here
                        </p>
                        <button
                            className={styles.logoutBtn}
                            style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={18} />
                            Create New Invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Invoice
