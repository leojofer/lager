//! Email addresses of the signed-in user: commits with one of them as the
//! author email count on the user's profile and link to it, once verified
//! (docs/decisions/0029-activity-graph.md). A connected GitHub account
//! adds the addresses it verified; one added here gets a mail with a link
//! that verifies it (docs/decisions/0030-email-verification.md).
use super::json_error;
use super::tokens::signed_in;
use crate::http::AppState;
use axum::{
    Json, Router,
    extract::{Path, State},
    http::{HeaderMap, StatusCode, header},
    response::{IntoResponse, Response},
    routing::{delete, get, post},
};
use lager_core::identity::{UserError, normalize_email};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/-/api/emails", get(list).post(add))
        .route("/-/api/emails/verify", post(verify))
        .route("/-/api/emails/{email}", delete(remove))
        .route("/-/api/emails/{email}/send", post(send))
}

const ANONYMOUS: &str = "sign in to manage your email addresses";

fn failure(error: UserError) -> Response {
    match error {
        UserError::Invalid(m) => json_error(StatusCode::BAD_REQUEST, "bad_request", &m),
        UserError::NotFound(_)
        | UserError::Exists(_)
        | UserError::TokenNotFound(_)
        | UserError::SshKeyNotFound(_) => json_error(
            StatusCode::FORBIDDEN,
            "unsupported",
            "email addresses need a user in the database",
        ),
        UserError::Unavailable(m) => {
            tracing::warn!(error = %m, "email request unavailable");
            json_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "unavailable",
                "email addresses unavailable; retry later",
            )
        }
    }
}

async fn list(State(s): State<AppState>, headers: HeaderMap) -> Result<Response, Response> {
    let (_, user) = signed_in(&s, &headers, false, ANONYMOUS).await?;
    let emails = s.directory.users().emails(&user).await.map_err(failure)?;
    Ok((
        [(header::CACHE_CONTROL, "no-store")],
        Json(serde_json::json!({
            "mail": s.mail.is_some(),
            "emails": emails
                .iter()
                .map(|(email, verified)| serde_json::json!({ "email": email, "verified": verified }))
                .collect::<Vec<_>>(),
        })),
    )
        .into_response())
}

#[derive(serde::Deserialize)]
struct Add {
    email: String,
}

async fn add(
    State(s): State<AppState>,
    headers: HeaderMap,
    Json(body): Json<Add>,
) -> Result<Response, Response> {
    let (_, user) = signed_in(&s, &headers, true, ANONYMOUS).await?;
    if s.mail.is_none() {
        return Err(no_mail());
    }
    let email = normalize_email(&body.email).map_err(failure)?;
    let users = s.directory.users();
    users.add_email(&user, &email).await.map_err(failure)?;
    tracing::info!(user = %user, "added an email address on the web");
    let verified = users
        .emails(&user)
        .await
        .map_err(failure)?
        .into_iter()
        .any(|(e, v)| e == email && v.is_some());
    if !verified {
        send_link(&s, &user, &email).await?;
    }
    Ok((
        StatusCode::CREATED,
        [(header::CACHE_CONTROL, "no-store")],
        Json(serde_json::json!({ "email": email, "sent": !verified })),
    )
        .into_response())
}

fn no_mail() -> Response {
    json_error(
        StatusCode::FORBIDDEN,
        "unsupported",
        "this server sends no mail, so it cannot verify addresses; connect GitHub to add the ones it verified",
    )
}

/// Mails a new link for an unverified address.
async fn send_link(s: &AppState, user: &str, email: &str) -> Result<(), Response> {
    let Some(mailer) = &s.mail else {
        return Err(no_mail());
    };
    let token = s
        .directory
        .users()
        .email_token(user, email)
        .await
        .map_err(failure)?;
    if let Err(e) = mailer.send_verification(user, email, &token).await {
        tracing::warn!(user, error = %e, "verification mail not sent");
        return Err(json_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "unavailable",
            "the mail could not be sent; try again in a minute",
        ));
    }
    tracing::info!(user, "sent a verification mail");
    Ok(())
}

/// Sends the link for an unverified address again.
async fn send(
    State(s): State<AppState>,
    headers: HeaderMap,
    Path(email): Path<String>,
) -> Result<Response, Response> {
    let (_, user) = signed_in(&s, &headers, true, ANONYMOUS).await?;
    let email = email.trim().to_lowercase();
    send_link(&s, &user, &email).await?;
    Ok(StatusCode::NO_CONTENT.into_response())
}

#[derive(serde::Deserialize)]
struct Verify {
    token: String,
}

/// Follows a mail's link: verifies its address for the signed-in user, if
/// that user added it.
async fn verify(
    State(s): State<AppState>,
    headers: HeaderMap,
    Json(body): Json<Verify>,
) -> Result<Response, Response> {
    let (_, user) = signed_in(&s, &headers, true, ANONYMOUS).await?;
    let email = s
        .directory
        .users()
        .verify_email(&user, &body.token)
        .await
        .map_err(failure)?;
    tracing::info!(user = %user, "verified an email address by mail");
    Ok((
        [(header::CACHE_CONTROL, "no-store")],
        Json(serde_json::json!({ "email": email })),
    )
        .into_response())
}

async fn remove(
    State(s): State<AppState>,
    headers: HeaderMap,
    Path(email): Path<String>,
) -> Result<Response, Response> {
    let (_, user) = signed_in(&s, &headers, true, ANONYMOUS).await?;
    let email = email.trim().to_lowercase();
    if !s
        .directory
        .users()
        .delete_email(&user, &email)
        .await
        .map_err(failure)?
    {
        return Err(json_error(
            StatusCode::NOT_FOUND,
            "not_found",
            "email address not found",
        ));
    }
    tracing::info!(user = %user, "deleted an email address on the web");
    Ok(StatusCode::NO_CONTENT.into_response())
}
