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
}

interface PaymentEmailProps {
    subject: string;
    body: string;
    paymentDetailsList: PaymentDetail[];
}

export const PaymentEmail = ({
    subject,
    body,
    paymentDetailsList,
}: PaymentEmailProps) => {
    // Format due date for display
    const formatDueDate = (dateStr?: string) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <html lang="en">
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
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        margin: '40px 0',
                        padding: '0',
                        color: '#333',
                    }}>{paymentDetailsList[0]?.accountName}</h1>

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
                                    Payment {paymentDetailsList.length > 1 ? `${index + 1} of ${paymentDetailsList.length}` : 'Details'}
                                </h2>

                                <p style={{ fontSize: '16px', lineHeight: '26px', color: '#333', margin: '8px 0' }}>
                                    <strong>Amount:</strong> {paymentDetails.amount} {paymentDetails.currency}
                                </p>
                                {paymentDetails.dueDate && (
                                    <p style={{ fontSize: '16px', lineHeight: '26px', color: '#d97706', margin: '8px 0' }}>
                                        <strong>Due Date:</strong> {formatDueDate(paymentDetails.dueDate)}
                                    </p>
                                )}
                                <p style={{ fontSize: '16px', lineHeight: '26px', color: '#333', margin: '8px 0' }}>
                                    <strong>Account:</strong> {paymentDetails.iban}
                                </p>
                                <p style={{ fontSize: '16px', lineHeight: '26px', color: '#333', margin: '8px 0' }}>
                                    <strong>Variable Symbol:</strong> {paymentDetails.variableSymbol}
                                </p>
                                {paymentDetails.constantSymbol && (
                                    <p style={{ fontSize: '16px', lineHeight: '26px', color: '#333', margin: '8px 0' }}>
                                        <strong>Constant Symbol:</strong> {paymentDetails.constantSymbol}
                                    </p>
                                )}
                                {paymentDetails.staticSymbol && (
                                    <p style={{ fontSize: '16px', lineHeight: '26px', color: '#333', margin: '8px 0' }}>
                                        <strong>Specific Symbol:</strong> {paymentDetails.staticSymbol}
                                    </p>
                                )}
                                <p style={{ fontSize: '16px', lineHeight: '26px', color: '#333', margin: '8px 0' }}>
                                    <strong>Message:</strong> {paymentDetails.description}
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
                                    Scan to pay {paymentDetailsList.length > 1 ? `payment ${index + 1}` : ''}
                                </p>
                            </div>

                            {index < paymentDetailsList.length - 1 && (
                                <hr style={{ borderColor: '#e6ebf1', margin: '20px 0' }} />
                            )}
                        </div>
                    ))}

                    <hr style={{ borderColor: '#e6ebf1', margin: '20px 0' }} />

                    <p style={{ color: '#8898aa', fontSize: '12px', lineHeight: '16px' }}>
                        Generated by SPAYD Applied
                    </p>
                </div>
            </body>
        </html>
    );
};
