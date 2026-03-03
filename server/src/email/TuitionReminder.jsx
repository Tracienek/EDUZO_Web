const React = require("react");

function TuitionReminder({
    teacherName,
    className,
    sessionsDone,
    sessionsTotal,
    actionUrl,
}) {
    return (
        <html>
            <body style={{ margin: 0, background: "#f6f7fb" }}>
                <div
                    style={{
                        maxWidth: 600,
                        margin: "24px auto",
                        background: "#fff",
                        borderRadius: 14,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            padding: 20,
                            background: "#0b1220",
                            color: "#fff",
                            fontWeight: 700,
                        }}
                    >
                        EDUZO
                    </div>

                    <div style={{ padding: 24, fontFamily: "Arial" }}>
                        <h2 style={{ margin: 0 }}>
                            Lớp đã hoàn thành — đến hạn thu học phí
                        </h2>
                        <p style={{ color: "#475569", lineHeight: 1.6 }}>
                            Xin chào <b>{teacherName}</b>,<br />
                            Lớp <b>“{className}”</b> đã hoàn thành{" "}
                            <b>
                                {sessionsDone}/{sessionsTotal}
                            </b>{" "}
                            buổi.
                        </p>

                        <a
                            href={actionUrl}
                            style={{
                                display: "inline-block",
                                padding: "12px 16px",
                                background: "#2563eb",
                                color: "#fff",
                                borderRadius: 10,
                                textDecoration: "none",
                                fontWeight: 700,
                            }}
                        >
                            Mở EDUZO & gửi email học phí
                        </a>

                        <p
                            style={{
                                marginTop: 16,
                                fontSize: 12,
                                color: "#94a3b8",
                            }}
                        >
                            Nếu bạn không thực hiện thao tác này, bạn có thể bỏ
                            qua email.
                        </p>
                    </div>
                </div>
            </body>
        </html>
    );
}

module.exports = TuitionReminder;
