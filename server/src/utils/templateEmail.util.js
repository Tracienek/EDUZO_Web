const otpTemplate = (toEmail, message = "", verificationCode) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css');
                body {
                    font-family: Arial, sans-serif;
                }
                span{
                    color: black;
                }
                .container {
                    width: 539px;
                    margin: 0 auto;
                    border: 1px solid #ccc;
                    padding: 20px;
                    border-radius: 10px;
                    background-color: #fff;
                }
                .header {
                    text-align: left;
                }
                .header img {
                    width: 100px;
                }
                .content {
                    background-image: url('https://res.cloudinary.com/fiyonce/image/upload/v1737688132/Mystical_Wallpaper_rdo4z1.jpg');
                    background-size: cover;
                    text-align: center;
                    margin-top: 20px;
                    padding: 30px 0px;
                    font-size: 16px;
                    border-radius: 10px;
                    font-weight: bold;
                }
                .content_container {
                    background-color: white;
                    padding: 8px 40px;
                    text-align: left;
                    border-radius: 10px;
                    display: inline-block;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
                }
                .content_container p{
                    margin: 5px 0;
                }
                .verification-code {
                    font-size: 25px;
                    font-weight: bold;
                    margin: 16px 0;
                    text-align: center;
                }
                .content_head {
                    font-weight: bold;
                }
                .content_note {
                    font-size: 12px;
                    font-weight: normal;
                    color: #4d4d4d;
                    font-style: italic;
                    text-align: center;
                }
                .footer {
                    margin-top: 20px;
                    text-align: left;
                    font-weight: 400;
                    font-size: 12px
                }
                .footer_final_p {
                    margin: 0;
                }
                .fiyonce_help {
                    color: #6B07EE;
                    text-decoration: none;
                    font-weight: bold;
                }
                .social-icons {
                    display: flex;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img style="width: 40px; height: auto; object-fit: cover" src="https://res.cloudinary.com/fiyonce/image/upload/w_60/v1743152687/MKT_materials__5_-removebg-preview_1_ohm7lc.png" alt="SoulEase">
                </div>
                <div class="content">
                    <div class="content_container">
                        <p class="content_head">Hello ${toEmail},</p>
                        <p>${message}</p>
                        <div class="verification-code">${verificationCode}</div>
                        <p class="content_note">*This code is valid for 30 minutes.</p>
                    </div>
                </div>
                <div style='font-size: 12px; text-align: justify;' class="footer">
                    <p>SoulEase is Vietnam’s leading platform for custom illustrations, bringing together talented young artists from a variety of art styles.</p>
                    <span>We're currently in beta and always looking to improve. Your feedback and suggestions are incredibly valuable to us. We look forward to seeing you on SoulEase!</span>
                    <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>

                    <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                    <p>If you have any questions or feedback, feel free to contact us at 
                        <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                        <a href="mailto:pastalltd@gmail.com">pastalltd@gmail.com</a>
                    </p>
                    <a style='color: #6B07EE; font-size: 12px;' class="fiyonce_help" href="mailto:pastalltd@gmail.com">pastalltd@gmail.com</a></p>
                    <!-- <div class="social-icons">
                        <a href="#" target="_blank" style='margin-right:12px;'><img height="22" src="https://res.cloudinary.com/fiyonce/image/upload/v1718068817/fiyonce/system/facebook_icon_sk9jnu.png" style="object-fit: cover; border-radius:0px;display:block" class="CToWUd" data-bit="iit" /></a>
                        <a href="#" target="_blank" style='margin-right:12px;'><img height="22" src="https://res.cloudinary.com/fiyonce/image/upload/v1718064053/fiyonce/system/tiktok_icon_zkvjzu.png" style="border-radius:0px;display:block" width="22" class="CToWUd" data-bit="iit"/></a>
                        <a href="#" target="_blank" style='margin-right:12px;'><img height="22" src="https://res.cloudinary.com/fiyonce/image/upload/v1718064137/fiyonce/system/instagram_icon_lzz8ox.png" style="border-radius:0px;display:block" width="22" class="CToWUd" data-bit="iit"/></a>
                        <a href="#" target="_blank" style='margin-right:12px;'><img height="22" src="https://res.cloudinary.com/fiyonce/image/upload/v1718064187/fiyonce/system/pinterest_icon_xjzzls.png" style="border-radius:0px;display:block" width="22" class="CToWUd" data-bit="iit"/></a>
                    </div> -->
                </div>
            </div>
        </body>
        </html>
    `;
};

const announcementTemplate = (subSubject = "", message = "", orderId) => {
    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SoulEase Violation Request Notification</title>
        <style>
            span .im {
                color: #4d4d4d !important;
            }
            .im, span.im, p.im, div.im, li.im {
                color: #4d4d4d !important;
            }
            .btn {
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 145px;
                padding: 6px 22px;
                background-color: #000;
                color: #fff;
                border-radius: 28px;
                text-decoration: none;
                font-size: 14px;
            }

            .btn:hover {
                background-color: #000000;
            }
        </style>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; font: 16px/1.5 Arial, Helvetica, sans-serif;">

        <div style="max-width: 539px; margin: 0 auto; background-color: #fff; padding: 16px 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); margin-top: 30px;">
            <!-- Logo Section -->
            <div style="text-align: left; margin-bottom: 25px;">
                <img style="width: 40px; height: auto; object-fit: cover" src="https://res.cloudinary.com/fiyonce/image/upload/w_60/v1743152687/MKT_materials__5_-removebg-preview_1_ohm7lc.png" alt="SoulEase Logo"/>
            </div>

            <!-- Content Section -->
            <div class="content">
                <span aria-hidden="true" style="display:none;"></span>
                <p style="font-size: 20px; font-weight: 600; margin-bottom: 25px; color: black;">${subSubject}</p>
                <p style="font-size: 17px; color: black;">${message}</p>
                <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                <p style="color: #4D4D4D; font-size: 14px">We hope you have a great experience commissioning on SoulEase.</p>
                <a class="btn" href="https://pastal.app" style="color: white; text-decoration: none; display: inline-block; text-align: center;">
                    <span style="float: left; height: 30px; line-height: 30px">Join Now</span>
                    <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                    <img class='svg' src="https://res.cloudinary.com/fiyonce/image/upload/v1727946925/fiyonce/system/next-button-removebg-preview_wpy3xa.png" alt="Icon" style="float: right; width: 30px; height: 30px;">
                </a>

                <div style="margin-top: 30px; font-size: 12px; color: #4D4D4D !important; line-height: 1.5; font-style: italic;">
                    <hr>
                    <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                    <p style="color: #4d4d4d;">SoulEase is Vietnam’s leading platform for custom artwork, connecting you with talented young artists across a variety of styles. We're still in beta, so we truly value your feedback and suggestions to help us improve. Thank you for being part of SoulEase!</p>
                    <p>If you have any questions or feedback, feel free to contact us at 
                    <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                    <a style='color: #6B07EE; font-size: 12px;' class="fiyonce_help" href="mailto:pastalltd@gmail.com">pastalltd@gmail.com</a></p>
                </div>
            </div>
        </div>

    </body>
    </html>
    `;
};

const commissionTemplate = (
    user,
    message = "",
    subSubject = "",
    orderCode,
    price,
) => {
    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SoulEase Commission Notification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                margin: 0;
                padding: 0;
            }

            .container {
                max-width: 539px;
                margin: 0 auto;
                background-color: #fff;
                padding: 16px 20px;
                border-radius: 10px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                margin-top: 30px;
            }

            .logo {
                text-align: left;
                margin-bottom: 25px;
            }

            .logo img {
                width: 100px;
            }

            .header {
                font-size: 20px;
                font-weight: 600;
                margin-top: 0px;
                margin-bottom: 25px;
                color: black;
            }

            .profile-card {
                display: flex;
                flex-direction: column;
                border: 1px solid #D9D9D9;
                border-radius: 20px;
                padding: 25px;
                margin-bottom: 20px;
                text-align: left;
            }
            .profile-card-head{
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            .profile-card img {
                border-radius: 50%;
                width: 60px;
                height: 60px;
                float: left;
                margin-right: 15px;
            }
            .order_scope{
                font-weight: 600;
                color: black;
            }
            .profile-card h2 {
                margin: 0;
                font-size: 18px;
                color: #000000;
            }
            .profile-card p {
                margin: 8px 0;
                color: black;
            }

            .order-details {
                color: black;
                margin-top: 15px;
            }

            .order-details span {
                font-weight: bold;
                color: #f38f44;
            }
            .artist-info p{
                color: #4D4D4D;
                margin: 0;
            }
            .btn {
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 145px;
                padding: 6px 22px;
                background-color: #000;
                color: #fff;
                border-radius: 28px;
                text-decoration: none;
                font-size: 14px;
            }
            .order_code{
                font-weight: bold;
            }
            .code{
                color: #f38f44;
            }

            .btn:hover {
                background-color: #000000;
            }

            .footer {
                margin-top: 30px;
                font-size: 14px;
                color: #4D4D4D;
                line-height: 1.5;
                font-style: italic;
            }

            .pastal_note{
                color: #4D4D4D;
                margin-left: 5px;
            }

            .footer a {
                text-decoration: none;
            }

            .footer a:hover {
                text-decoration: underline;
            }
            .a3s {
                direction: ltr;
                font: 16px/1.5 Arial, Helvetica, sans-serif; /* Set font size to 16px */
                overflow-x: auto;
                overflow-y: hidden;
                position: relative;
            }
            .gt{
                font-size: 1rem
            }
            
        </style>
    </head>
    <body>

        <div class="container" style="font: 16px/1.5 Arial, Helvetica, sans-serif;">
            <!-- Logo Section -->
            <div class="logo">
                    <img style="width: 40px; height: auto; object-fit: cover" src="https://res.cloudinary.com/fiyonce/image/upload/w_60/v1743152687/MKT_materials__5_-removebg-preview_1_ohm7lc.png" alt="SoulEase">
            </div>

            <!-- Content Section -->
            <div class="content">
                <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                <p class="header">${subSubject}</p>

                <!-- Profile Card -->
                <div class="profile-card" style="display: flex; flex-direction: column; flex-direction: column !important; display: block;">
                    <div class="profile-card-head">
                        <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                        <img src="https://d20udoy3ljlo2e.cloudfront.net/${user.avatar}" alt="Artist Avatar">
                        <div class="artist-info">
                            <h2>${user.fullName}</h2>
                            <p>@${user.domainName}</p>
                            <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                        </div>
                    </div>
                    <!-- Order Details -->
                    ${price ? `<p class="order-details"><span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>${price}<br></p>` : ""}

                    <!-- Order Scope -->
                    ${message ? `<p class="order_scope"><span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>${message}<br></p>` : ""}

                    <!-- Order Code -->
                    ${orderCode ? `<p class="order_code"><span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>${orderCode}</p>` : ""}
                </div>
                <p class="pastal_note">We hope you have a great experience commissioning on SoulEase.</p>
                
                <!-- Button -->
                <a class="btn" href="https://pastal.app/my-commission-requests" style="color: white; text-decoration: none; display: inline-block; text-align: center;">
                    <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                    <span style="float: left; height: 30px; line-height: 30px">View Details</span>
                    <img class='svg' src="https://res.cloudinary.com/fiyonce/image/upload/v1727946925/fiyonce/system/next-button-removebg-preview_wpy3xa.png" alt="Icon" style="float: right; width: 30px; height: 30px;">
                </a>

                <!-- Footer -->
                <div class="footer">
                    <hr>
                    <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                    <p>SoulEase is Vietnam’s leading platform for custom illustrations, home to many young and talented artists from a wide range of art styles. We're still in beta, and your feedback truly helps us grow and improve. Thank you for being with us on this journey!</p>
                    <p>If you have any questions or suggestions, feel free to reach out at <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                    <a href="mailto:pastal@gmail.com">pastal@gmail.com</a> or via our <a href="mailto:pastal@gmail.com">Facebook Page</a></p>
                </div>
            </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/dist/boxicons.min.js"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css">
    </body>
    </html>
    `;
};

const reportTemplate = (subSubject = "", reason) => {
    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SoulEase Violation Request Notification</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; font: 16px/1.5 Arial, Helvetica, sans-serif;">

        <div style="max-width: 539px; margin: 0 auto; background-color: #fff; padding: 16px 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); margin-top: 30px;">
            <!-- Logo Section -->
            <div style="text-align: left; margin-bottom: 25px;">
                <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                    <img style="width: 40px; height: auto; object-fit: cover" src="https://res.cloudinary.com/fiyonce/image/upload/w_60/v1743152687/MKT_materials__5_-removebg-preview_1_ohm7lc.png" alt="SoulEase">
            </div>

            <!-- Content Section -->
            <div class="content">
                <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                <p style="font-size: 20px; font-weight: 600; margin-bottom: 25px; color: black;">${subSubject}</p>

                <div style="border: 1px solid #D9D9D9; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                    <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                    <div style="display: block; margin-bottom: 8px; color: #4D4D4D;">
                        ${reason}
                        <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                    </div>
                </div>
            </div>
        </div>

    </body>
    </html>
    `;
};

const announcementTemplateType2 = (subSubject = "", message = "", url) => {
    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SoulEase Violation Request Notification</title>
        <style>
            span .im {
                color: #4d4d4d !important;
            }
            .btn {
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 145px;
                padding: 6px 22px;
                background-color: #000;
                color: #fff;
                border-radius: 28px;
                text-decoration: none;
                font-size: 14px;
            }

            .btn:hover {
                background-color: #000000;
            }
        </style>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; font: 16px/1.5 Arial, Helvetica, sans-serif;">

        <div style="max-width: 539px; margin: 0 auto; background-color: #fff; padding: 16px 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); margin-top: 30px;">
            <!-- Logo Section -->
            <div style="text-align: left; margin-bottom: 25px;">
                <img style="width: 40px; height: auto; object-fit: cover" src="https://res.cloudinary.com/fiyonce/image/upload/w_60/v1743152687/MKT_materials__5_-removebg-preview_1_ohm7lc.png" alt="SoulEase Logo"/>
            </div>

            <!-- Content Section -->
            <div class="content">
                <span aria-hidden="true" style="display:none;"></span>
                <p style="font-size: 20px; font-weight: 600; margin-bottom: 25px; color: black;">${subSubject}</p>
                <p style="font-size: 17px; color: black;">${message}</p>
                <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                <p style="color: #4D4D4D; font-size: 14px">We hope you enjoy your experience with commissions on SoulEase.</p>
                <a class="btn" href="${url}" style="color: white; text-decoration: none; display: inline-block; text-align: center;">
                    <span style="float: left; height: 30px; line-height: 30px">View Details</span>
                    <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                    <img class='svg' src="https://res.cloudinary.com/fiyonce/image/upload/v1727946925/fiyonce/system/next-button-removebg-preview_wpy3xa.png" alt="Icon" style="float: right; width: 30px; height: 30px;">
                </a>

                <div style="margin-top: 30px; font-size: 12px; color: #4D4D4D !important; line-height: 1.5; font-style: italic;">
                    <hr>
                    <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                    <p style="color: #4d4d4d;">SoulEase is a creative platform where talented artists from all backgrounds come together to bring your ideas to life. We're still in beta, so your feedback means a lot and helps us make things better for everyone. Thank you for being here.</p>
                    <p>If you have any questions or suggestions, feel free to reach out to us at 
                    <span aria-hidden="true" style="display:none;">${new Date().getTime()}</span>
                    <a style='color: #6B07EE; font-size: 12px;' class="fiyonce_help" href="mailto:pastalltd@gmail.com">pastalltd@gmail.com</a></p>
                </div>
            </div>
        </div>

    </body>
    </html>
    `;
};

// Export or use these functions as needed
export {
    otpTemplate,
    announcementTemplate,
    announcementTemplateType2,
    commissionTemplate,
    reportTemplate,
};
