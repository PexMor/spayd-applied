interface PaymentDetail {
    amount: number;
    currency: string;
    variableSymbol: string;
    staticSymbol: string;
    constantSymbol: string;
    iban: string;
    accountName: string;
    description: string;
    qrCodeDataUrl: string;
    dueDate?: string;  // Optional due date
    logoUrl?: string;
}

interface PaymentEmailProps {
    subject: string;
    body: string;
    paymentDetailsList: PaymentDetail[];
    t: any;
    locale: string;
}

export const PaymentEmail = ({
    subject,
    body,
    paymentDetailsList,
    t,
    locale,
}: PaymentEmailProps) => {
    // Format due date for display
    const formatDueDate = (dateStr?: string) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return date.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <html lang={locale}>
            <head>
                <meta charSet="UTF-8" />
                <title>{subject}</title>
            </head>
            <body style={{
                backgroundColor: '#ffffff',
                fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
            }}>
                <div style={{
                    margin: '0 auto',
                    padding: '20px 0 48px',
                    maxWidth: '560px',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '40px',
                        borderBottom: '2px solid #f4f4f4',
                        paddingBottom: '20px'
                    }}>
                        <div style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: '#333'
                        }}>
                            {subject}
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px'
                        }}>
                            {/* <div style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: '#555',
                                textAlign: 'right'
                            }}>
                                {paymentDetailsList[0]?.accountName}
                            </div> */}
                            {paymentDetailsList[0]?.logoUrl && (
                                <img
                                    src={paymentDetailsList[0].logoUrl}
                                    alt="Logo"
                                    style={{
                                        height: '40px',
                                        width: 'auto',
                                        objectFit: 'contain'
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    <div style={{
                        fontSize: '16px',
                        lineHeight: '26px',
                        color: '#333',
                        whiteSpace: 'pre-wrap',
                    }}>{body}</div>

                    <hr style={{
                        borderColor: '#e6ebf1',
                        margin: '20px 0',
                    }} />

                    {paymentDetailsList.map((paymentDetails, index) => (
                        <div key={index}>
                            <div style={{
                                backgroundColor: '#f4f4f4',
                                padding: '24px',
                                borderRadius: '4px',
                                margin: '24px 0',
                            }}>
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    margin: '0 0 16px 0',
                                    color: '#333',
                                }}>
                                    {paymentDetailsList.length > 1
                                        ? t.emailPaymentXofY.replace('{current}', index + 1).replace('{total}', paymentDetailsList.length)
                                        : t.emailPaymentDetails}
                                </h2>

                                <p style={{ fontSize: '16px', lineHeight: '26px', color: '#333', margin: '8px 0' }}>
                                    <strong>{t.amount}:</strong> {paymentDetails.amount} {paymentDetails.currency}
                                </p>
                                {paymentDetails.dueDate && (
                                    <p style={{ fontSize: '16px', lineHeight: '26px', color: '#d97706', margin: '8px 0' }}>
                                        <strong>{t.emailDueDate}:</strong> {formatDueDate(paymentDetails.dueDate)}
                                    </p>
                                )}
                                <p style={{ fontSize: '16px', lineHeight: '26px', color: '#333', margin: '8px 0' }}>
                                    <strong>{t.account}:</strong> {paymentDetails.iban}
                                </p>
                                <p style={{ fontSize: '16px', lineHeight: '26px', color: '#333', margin: '8px 0' }}>
                                    <strong>{t.variableSymbol}:</strong> {paymentDetails.variableSymbol}
                                </p>
                                {paymentDetails.constantSymbol && (
                                    <p style={{ fontSize: '16px', lineHeight: '26px', color: '#333', margin: '8px 0' }}>
                                        <strong>{t.emailConstantSymbol}:</strong> {paymentDetails.constantSymbol}
                                    </p>
                                )}
                                {paymentDetails.staticSymbol && (
                                    <p style={{ fontSize: '16px', lineHeight: '26px', color: '#333', margin: '8px 0' }}>
                                        <strong>{t.emailSpecificSymbol}:</strong> {paymentDetails.staticSymbol}
                                    </p>
                                )}
                                <p style={{ fontSize: '16px', lineHeight: '26px', color: '#333', margin: '8px 0' }}>
                                    <strong>{t.message}:</strong> {paymentDetails.description}
                                </p>
                            </div>

                            <div style={{ textAlign: 'center', margin: '32px 0' }}>
                                <img
                                    src={paymentDetails.qrCodeDataUrl}
                                    width="200"
                                    height="200"
                                    alt={`QR Payment Code ${index + 1}`}
                                    style={{ margin: '0 auto' }}
                                />
                                <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                                    {paymentDetailsList.length > 1
                                        ? t.emailScanToPayX.replace('{current}', index + 1)
                                        : t.emailScanToPay}
                                </p>
                            </div>

                            {index < paymentDetailsList.length - 1 && (
                                <hr style={{ borderColor: '#e6ebf1', margin: '20px 0' }} />
                            )}
                        </div>
                    ))}

                    <hr style={{ borderColor: '#e6ebf1', margin: '20px 0' }} />

                    <p style={{ color: '#8898aa', fontSize: '12px', lineHeight: '16px' }}>
                        {t.emailGeneratedBy}
                    </p>
                </div>
            </body>
        </html>
    );
};
