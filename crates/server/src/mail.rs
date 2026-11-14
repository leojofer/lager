//! Mail that verifies email addresses
//! (docs/decisions/0032-email-verification.md). The link in it works only
//! for the user who added the address, so a stranger who follows it
//! verifies nothing for anyone else.

use lager_core::config::MailConfig;
use lager_core::limits::{EMAIL_SEND_TIMEOUT, EMAIL_TOKEN_TTL};
use lettre::message::{Mailbox, header::ContentType};
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};

pub struct Mailer {
    transport: AsyncSmtpTransport<Tokio1Executor>,
    from: Mailbox,
    origin: String,
}

impl Mailer {
    pub fn new(cfg: &MailConfig) -> anyhow::Result<Self> {
        let transport = AsyncSmtpTransport::<Tokio1Executor>::from_url(&cfg.smtp_url)
            .map_err(|e| anyhow::anyhow!("LAGER_SMTP_URL: {e}"))?
            .timeout(Some(EMAIL_SEND_TIMEOUT))
            .build();
        let from = cfg
            .from
            .parse()
            .map_err(|e| anyhow::anyhow!("LAGER_MAIL_FROM: {e}"))?;
        Ok(Self {
            transport,
            from,
            origin: cfg.origin.clone(),
        })
    }

    /// Sends the link that verifies `email` for `user`.
    pub async fn send_verification(
        &self,
        user: &str,
        email: &str,
        token: &str,
    ) -> anyhow::Result<()> {
        let host = self
            .origin
            .split_once("://")
            .map_or(self.origin.as_str(), |(_, h)| h);
        let link = format!("{}/-/settings/emails?verify={token}", self.origin);
        let hours = EMAIL_TOKEN_TTL.as_secs() / 3600;
        let body = format!(
            "{user} added this address to their account on {host}.\n\
             \n\
             If that is you, open this link while signed in as {user} to verify it:\n\
             \n\
             {link}\n\
             \n\
             The link works for {hours} hours. If you did not add this address, ignore\n\
             this mail; nothing changes.\n"
        );
        let message = Message::builder()
            .from(self.from.clone())
            .to(email.parse()?)
            .subject(format!("Verify your email address on {host}"))
            .header(ContentType::TEXT_PLAIN)
            .body(body)?;
        self.transport.send(message).await?;
        Ok(())
    }
}
