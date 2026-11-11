const tuitionDueTemplate = (
    studentName = "",
    className = "",
    sessionsCompleted = 0,
    amountDue = "",
    dueDate = "",
    paymentUrl = "",
) => {
    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thông báo học phí đến hạn</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                margin: 0;
                padding: 0;
                font: 16px/1.5 Arial, Helvetica, sans-serif;
                color: #000;
            }

            .container {
                max-width: 539px;
                margin: 30px auto;
                background-color: #fff;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
            }

            .logo {
                text-align: left;
                margin-bottom: 24px;
            }

            .logo img {
                width: 40px;
                height: auto;
                object-fit: cover;
            }

            .title {
                font-size: 22px;
                font-weight: 700;
                margin-bottom: 20px;
                color: #000;
            }

            .text {
                font-size: 16px;
                color: #222;
                margin: 10px 0;
            }

            .info-box {
                border: 1px solid #E5E5E5;
                border-radius: 12px;
                padding: 18px;
                margin: 20px 0;
                background-color: #fafafa;
            }

            .info-row {
                margin: 8px 0;
                font-size: 15px;
                color: #333;
            }

            .info-label {
                font-weight: 700;
                color: #000;
            }

            .highlight {
                color: var(--primary-color);
                font-weight: 700;
            }

            .btn {
                display: inline-block;
                margin-top: 10px;
                padding: 12px 22px;
                background-color: #000;
                color: #fff !important;
                text-decoration: none;
                border-radius: 999px;
                font-size: 14px;
                font-weight: bold;
            }

            .note {
                margin-top: 18px;
                font-size: 14px;
                color: #666;
            }

            .footer {
                margin-top: 30px;
                padding-top: 16px;
                border-top: 1px solid #E5E5E5;
                font-size: 12px;
                color: #666;
                line-height: 1.6;
            }

            .footer a {
                color: var(--primary-color);
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <img src="https://res.cloudinary.com/fiyonce/image/upload/w_60/v1743152687/MKT_materials__5_-removebg-preview_1_ohm7lc.png" alt="Logo">
            </div>

            <div class="title">Thông báo học phí đến hạn</div>

            <p class="text">Xin chào ${studentName || "Quý phụ huynh/học viên"},</p>

            <p class="text">
                Lớp <strong>"${className}"</strong> đã đến hạn đóng học phí.
            </p>

            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">Tên lớp:</span> ${className}
                </div>
                <div class="info-row">
                    <span class="info-label">Số buổi đã học:</span> ${sessionsCompleted} buổi
                </div>
               
               
            </div>

            <p class="text">
                Vui lòng hoàn tất học phí đúng hạn để đảm bảo quá trình học của lớp không bị gián đoạn.
            </p>

            

            <div class="footer">
                <p>
                    Đây là email thông báo tự động từ hệ thống. Nếu bạn cần hỗ trợ, vui lòng liên hệ qua email
                    <a href="mailto:baotran09042004@gmail.com">baotran09042004@gmail.com</a>.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
};
