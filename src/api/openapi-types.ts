export interface paths {
  "/": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List all auctions
     * @description Returns public auction summaries filtered by status.
     */
    get: operations["GET__"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/account": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Return current account profile
     * @description GET /api/v1/account
     */
    get: operations["GET__api_v1_account"];
    /**
     * Update account profile (MVP: name only)
     * @description PATCH /api/v1/account
     */
    put: operations["PUT__api_v1_account"];
    post?: never;
    /**
     * Disable (soft delete) the current account and revoke sessions
     * @description DELETE /api/v1/account
     */
    delete: operations["DELETE__api_v1_account"];
    options?: never;
    head?: never;
    /**
     * Update account profile (MVP: name only)
     * @description PATCH /api/v1/account
     */
    patch: operations["PATCH__api_v1_account"];
    trace?: never;
  };
  "/api/v1/account/data/export": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get the latest account export status
     * @description GET /api/v1/account/data/export
     */
    get: operations["GET__api_v1_account_data_export"];
    put?: never;
    /**
     * Request an account export (MVP)
     * @description POST /api/v1/account/data/export
     */
    post: operations["POST__api_v1_account_data_export"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/account/email-change": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Request an email address change (verification required)
     * @description POST /api/v1/account/email-change
     */
    post: operations["POST__api_v1_account_email-change"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/account/export": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Return an account export (or start async export)
     * @description GET /api/v1/account/export
     *     Returns the export JSON when ready; otherwise returns export metadata (202) so clients can poll.
     */
    get: operations["GET__api_v1_account_export"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/account/notifications": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Return notification preferences for the current user
     * @description GET /api/v1/account/notifications
     */
    get: operations["GET__api_v1_account_notifications"];
    /**
     * Update notification preferences for the current user
     * @description PUT /api/v1/account/notifications
     */
    put: operations["PUT__api_v1_account_notifications"];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/account/password": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Change password for the current user
     * @description POST /api/v1/account/password
     *     Revokes all other active sessions on success.
     */
    post: operations["POST__api_v1_account_password"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/account/security": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Return account security fields (email verification)
     * @description GET /api/v1/account/security
     */
    get: operations["GET__api_v1_account_security"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/account/sessions": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List active sessions for the current user
     * @description GET /api/v1/account/sessions
     */
    get: operations["GET__api_v1_account_sessions"];
    put?: never;
    post?: never;
    /**
     * Revoke all sessions except current
     * @description POST /api/v1/account/sessions/revoke_others
     *     DELETE /api/v1/account/sessions
     */
    delete: operations["DELETE__api_v1_account_sessions"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/account/sessions/revoke_others": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Revoke all sessions except current
     * @description POST /api/v1/account/sessions/revoke_others
     *     DELETE /api/v1/account/sessions
     */
    post: operations["POST__api_v1_account_sessions_revoke_others"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/account/sessions/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Revoke a session token for the current user
     * @description DELETE /api/v1/account/sessions/:id
     */
    delete: operations["DELETE__api_v1_account_sessions_{id}"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/auctions": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List auctions for admin with filters and pagination
     * @description GET /api/v1/admin/auctions
     *     Returns auctions with optional status, date, and search filters for admin views.
     */
    get: operations["GET__api_v1_admin_auctions"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/auctions/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Show auction details for admin
     * @description GET /api/v1/admin/auctions/:id
     *     Retrieves full auction details for administrators.
     */
    get: operations["GET__api_v1_admin_auctions_{id}"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/audit": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Create an audit log entry
     * @description POST /api/v1/admin/audit
     *     Records an audit log for administrative actions.
     */
    post: operations["POST__api_v1_admin_audit"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/bid-packs": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List all bid packs (admin)
     * @description GET /admin/bid_packs
     *     Lists all bid packs including retired ones for administrative management.
     */
    get: operations["GET__api_v1_admin_bid-packs"];
    put?: never;
    /**
     * Create
     * @description POST /admin/bid_packs
     *     Create a bid pack with the provided attributes.
     */
    post: operations["POST__api_v1_admin_bid-packs"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/bid-packs/new": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Return a template bid pack for creation
     * @description GET /admin/bid_packs/new
     */
    get: operations["GET__api_v1_admin_bid-packs_new"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/bid-packs/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Show a bid pack (admin)
     * @description GET /admin/bid_packs/:id
     */
    get: operations["GET__api_v1_admin_bid-packs_{id}"];
    /**
     * Update a bid pack (admin)
     * @description PATCH/PUT /admin/bid_packs/:id
     *     Updates bid pack fields or status.
     */
    put: operations["PUT__api_v1_admin_bid-packs_{id}"];
    post?: never;
    /**
     * Retire (deactivate) a bid pack (admin)
     * @description DELETE /admin/bid_packs/:id
     *     Retires a bid pack to prevent purchase while keeping history.
     *     Retires an existing bid pack while preserving purchase history.
     */
    delete: operations["DELETE__api_v1_admin_bid-packs_{id}"];
    options?: never;
    head?: never;
    /**
     * Update a bid pack (admin)
     * @description PATCH/PUT /admin/bid_packs/:id
     *     Updates bid pack fields or status.
     */
    patch: operations["PATCH__api_v1_admin_bid-packs_{id}"];
    trace?: never;
  };
  "/api/v1/admin/bid-packs/{id}/edit": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Fetch a bid pack for editing
     * @description GET /admin/bid_packs/:id/edit
     */
    get: operations["GET__api_v1_admin_bid-packs_{id}_edit"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/fulfillments/{id}/complete": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Move fulfillment from shipped -> complete
     * @description POST /api/v1/admin/fulfillments/:id/complete
     */
    post: operations["POST__api_v1_admin_fulfillments_{id}_complete"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/fulfillments/{id}/process": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Move fulfillment from claimed -> processing
     * @description POST /api/v1/admin/fulfillments/:id/process
     */
    post: operations["POST__api_v1_admin_fulfillments_{id}_process"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/fulfillments/{id}/ship": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Move fulfillment from processing -> shipped
     * @description POST /api/v1/admin/fulfillments/:id/ship
     */
    post: operations["POST__api_v1_admin_fulfillments_{id}_ship"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/maintenance": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Show current maintenance mode state
     * @description GET /api/v1/admin/maintenance
     *     Returns the maintenance toggle state for administrators.
     */
    get: operations["GET__api_v1_admin_maintenance"];
    put?: never;
    /**
     * Toggle maintenance mode on or off
     * @description POST /api/v1/admin/maintenance?enabled=true
     *     Also accepts JSON body { enabled: true }
     *     Enables or disables maintenance mode.
     */
    post: operations["POST__api_v1_admin_maintenance"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/payments": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List payments with optional email search
     * @description GET /api/v1/admin/payments
     *     Lists purchases with optional fuzzy email search for admins.
     */
    get: operations["GET__api_v1_admin_payments"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/payments/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Show a payment reconciliation view
     * @description GET /api/v1/admin/payments/:id
     *     Returns the purchase, related credit transactions, and a balance audit for admins.
     */
    get: operations["GET__api_v1_admin_payments_{id}"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/payments/{id}/refund": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Issue a refund for a payment
     * @description POST /api/v1/admin/payments/:id/refund
     *     Issues a refund for a payment and records the refund ID from the gateway.
     */
    post: operations["POST__api_v1_admin_payments_{id}_refund"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/payments/{id}/repair_credits": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Repair missing purchase credits
     * @description POST /api/v1/admin/payments/:id/repair_credits
     *     Ensures the ledger grant exists for a completed purchase without double-crediting.
     */
    post: operations["POST__api_v1_admin_payments_{id}_repair_credits"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/users": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List admin and superadmin users
     * @description GET /api/v1/admin/users
     *     Returns the list of administrative users.
     */
    get: operations["GET__api_v1_admin_users"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/users/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Update an admin/superadmin user record
     * @description PATCH/PUT /api/v1/admin/users/:id
     */
    put: operations["PUT__api_v1_admin_users_{id}"];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Update an admin/superadmin user record
     * @description PATCH/PUT /api/v1/admin/users/:id
     */
    patch: operations["PATCH__api_v1_admin_users_{id}"];
    trace?: never;
  };
  "/api/v1/admin/users/{id}/ban": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Ban a user account */
    post: operations["POST__api_v1_admin_users_{id}_ban"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/users/{id}/grant_admin": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Grant admin role to a user */
    post: operations["POST__api_v1_admin_users_{id}_grant_admin"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/users/{id}/grant_superadmin": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Grant superadmin role to a user */
    post: operations["POST__api_v1_admin_users_{id}_grant_superadmin"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/users/{id}/revoke_admin": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Revoke admin role from a user */
    post: operations["POST__api_v1_admin_users_{id}_revoke_admin"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/admin/users/{id}/revoke_superadmin": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Revoke superadmin role from a user */
    post: operations["POST__api_v1_admin_users_{id}_revoke_superadmin"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auctions": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List all auctions
     * @description Returns public auction summaries filtered by status.
     */
    get: operations["GET__api_v1_auctions"];
    put?: never;
    /**
     * Create a new auction (admin only)
     * @description Create and schedule or activate an auction. Status values are normalized to the allowed list.
     */
    post: operations["POST__api_v1_auctions"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auctions/{auction_id}/bid_history": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List bids for a given auction (newest first)
     * @description GET /api/v1/auctions/:auction_id/bid_history
     *     Returns the current bid list for an auction along with the winning user, if present.
     */
    get: operations["GET__api_v1_auctions_{auction_id}_bid_history"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auctions/{auction_id}/bids": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Place a bid on an auction
     * @description Places a bid for the current user on the specified auction.
     */
    post: operations["POST__api_v1_auctions_{auction_id}_bids"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auctions/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Retrieve a single auction with bids
     * @description Fetches the auction and embeds the current bid list.
     */
    get: operations["GET__api_v1_auctions_{id}"];
    /**
     * Update an existing auction (admin only)
     * @description Update auction details or transition status for an existing auction.
     */
    put: operations["PUT__api_v1_auctions_{id}"];
    post?: never;
    /**
     * Retire an auction (admin only)
     * @description Retire an auction to prevent further bids while keeping history intact.
     */
    delete: operations["DELETE__api_v1_auctions_{id}"];
    options?: never;
    head?: never;
    /**
     * Update an existing auction (admin only)
     * @description Update auction details or transition status for an existing auction.
     */
    patch: operations["PATCH__api_v1_auctions_{id}"];
    trace?: never;
  };
  "/api/v1/auctions/{id}/extend_time": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Extend an auction's end time (admin only)
     * @description Extends an active auction within the configured extension window.
     */
    post: operations["POST__api_v1_auctions_{id}_extend_time"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auctions/{id}/watch": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Create
     * @description POST /api/v1/auctions/:id/watch
     */
    post: operations["POST__api_v1_auctions_{id}_watch"];
    /**
     * Delete
     * @description DELETE /api/v1/auctions/:id/watch
     */
    delete: operations["DELETE__api_v1_auctions_{id}_watch"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/bid_packs": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List available bid packs
     * @description Publicly lists active bid packs available for purchase.
     */
    get: operations["GET__api_v1_bid_packs"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/checkout/status": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Check the Stripe checkout session status
     * @description Fetches the status of a Stripe checkout session using its ID.
     */
    get: operations["GET__api_v1_checkout_status"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/checkout/success": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Handle successful checkout callbacks and credit the user
     * @description Idempotently processes a paid checkout session and credits the user with purchased bids.
     */
    get: operations["GET__api_v1_checkout_success"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/checkouts": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Start a Stripe Checkout session for a bid pack
     * @description Initializes a Stripe checkout session for the given bid pack and returns the client secret.
     */
    post: operations["POST__api_v1_checkouts"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/email_verifications/resend": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Resend verification email for the current user
     * @description POST /api/v1/email_verifications/resend
     */
    post: operations["POST__api_v1_email_verifications_resend"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/email_verifications/verify": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Verify an email verification token
     * @description GET /api/v1/email_verifications/verify
     */
    get: operations["GET__api_v1_email_verifications_verify"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/logged_in": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Check whether the provided token is valid
     * @description GET /api/v1/logged_in
     *     Returns session and user context if the token is valid.
     */
    get: operations["GET__api_v1_logged_in"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/login": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Log in and create a session
     * @description POST /api/v1/login
     *     Authenticates a user and returns session tokens plus user context.
     */
    post: operations["POST__api_v1_login"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/logout": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Log out and revoke the current session token
     * @description DELETE /api/v1/logout
     *     Revokes the active session token and returns a confirmation message.
     */
    delete: operations["DELETE__api_v1_logout"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/maintenance": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Show public maintenance mode state
     * @description GET /api/v1/maintenance
     *     Returns whether maintenance mode is enabled for end users.
     */
    get: operations["GET__api_v1_maintenance"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/me": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Return the authenticated user
     * @description GET /api/v1/me
     */
    get: operations["GET__api_v1_me"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/me/account": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/me/account/*path": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/me/activity": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List current user's activity feed
     * @description GET /api/v1/me/activity
     *     Merges bids, watches, and outcomes into a single newest-first feed.
     *     NOTE: Currently merges in Ruby; may not scale for large histories.
     */
    get: operations["GET__api_v1_me_activity"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/me/notifications": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List current user's notifications (newest first)
     * @description GET /api/v1/me/notifications
     */
    get: operations["GET__api_v1_me_notifications"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/me/purchases": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List current user's purchases (newest first)
     * @description GET /api/v1/me/purchases
     */
    get: operations["GET__api_v1_me_purchases"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/me/purchases/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Show purchase details for current user
     * @description GET /api/v1/me/purchases/:id
     */
    get: operations["GET__api_v1_me_purchases_{id}"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/me/wins": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List current user's auction wins (newest first)
     * @description GET /api/v1/me/wins
     */
    get: operations["GET__api_v1_me_wins"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/me/wins/{auction_id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Show win details for current user
     * @description GET /api/v1/me/wins/:auction_id
     */
    get: operations["GET__api_v1_me_wins_{auction_id}"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/me/wins/{auction_id}/claim": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Claim a won auction by providing a shipping address
     * @description POST /api/v1/me/wins/:auction_id/claim
     */
    post: operations["POST__api_v1_me_wins_{auction_id}_claim"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/password/forgot": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Request a password reset email */
    post: operations["POST__api_v1_password_forgot"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/password/reset": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Reset a password using a token */
    post: operations["POST__api_v1_password_reset"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/session/refresh": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Refresh the current session using a refresh token
     * @description Exchanges a valid refresh token for a new session token pair.
     */
    post: operations["POST__api_v1_session_refresh"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/session/remaining": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Return remaining time for the current session token
     * @description Provides session token metadata for the authenticated user.
     */
    get: operations["GET__api_v1_session_remaining"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/signup": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Register a new user account and create a session (login-equivalent contract)
     * @description POST /api/v1/signup
     */
    post: operations["POST__api_v1_signup"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/stripe/webhooks": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Create */
    post: operations["POST__api_v1_stripe_webhooks"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/users": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Register a new user account (legacy alias of /api/v1/signup)
     * @description POST /api/v1/users
     */
    post: operations["POST__api_v1_users"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/wallet": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Show current credits balance
     * @description GET /api/v1/wallet
     *     Returns the user's current credits balance, derived from the append-only ledger,
     *     plus an audit comparison against the cached `bid_credits` column.
     */
    get: operations["GET__api_v1_wallet"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/wallet/transactions": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List wallet ledger transactions (newest first)
     * @description GET /api/v1/wallet/transactions
     *     Returns a paginated view of the user's append-only ledger history.
     */
    get: operations["GET__api_v1_wallet_transactions"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    "071d7542ed3e657e63c9bbdfb6c66c5e": {
      amount?: Record<string, never>;
      created_at?: string;
      id?: number;
      refund_id?: string;
      refunded_cents?: number;
      status?: string;
      stripe_checkout_session_id?: string;
      stripe_event_id?: string;
      stripe_payment_intent_id?: string;
      user_email?: string;
    };
    "09eda044efad4320218b100180234bec": components["schemas"]["UserSession"];
    /** @description Invalid schema placeholder from source: wallettransactions */
    "0b27bc2d4f067d7b4e46fc6fbfbaf4c2": {
      [key: string]: unknown;
    };
    "0c805fddae341e8fec983e81eca5ba05": components["schemas"]["ValidationErrors"];
    "0c90018525308fa74a5c4563f158a360": {
      email_address?: string;
      id?: number;
      name?: string;
      role?: string;
    }[];
    "0cc56eaebe1128597970f1e9d17d5db5": components["schemas"]["AccountExportResponse"];
    "0ff4072fbad423c5d8e556357b2a12e7": components["schemas"]["BidPackUpsert"];
    /** @description Invalid schema placeholder from source: hash{} */
    "183f737b640374d4f693193012fa6154": {
      [key: string]: unknown;
    };
    "195fee13a2e676e36bcaf119071f3cc9": components["schemas"]["BidPack"][];
    "1d72cc17842046d9c1a343fb85baa2bc": {
      amount?: Record<string, never>;
      created_at?: string;
      id?: number;
      refunded_cents?: number;
      status?: string;
      user_email?: string;
    }[];
    "264961f1d98ca80176fc486fdf41eaba": components["schemas"]["AccountDeleteRequest"];
    "276c024e8515065c3bec759819bda57c": components["schemas"]["LoginRequest"];
    "2d935b114de85d13479f1b86247e8262": components["schemas"]["AccountSessionsResponse"];
    "2fcd9b5aab073fe3e7e089bfc0ede365": {
      email_address?: string;
      id?: number;
      name?: string;
      role?: string;
    };
    "30d3c70eaf62d1e420cb43b97fdec55f": components["schemas"]["MaintenanceToggle"];
    "3b6a8f53a53c0471294532bfc2aa40b3": components["schemas"]["AdminUserUpdate"];
    "3e47d336c6c6a6fa077f7f17876e56f1": components["schemas"]["Error"];
    "48ae3f28abfc1838fe5cc1decd11167c": {
      sessions_revoked?: number;
      status?: string;
    };
    "5fa0310957b5c0b33595a49f03b95e19": components["schemas"]["ChangePasswordRequest"];
    "6175057dd6ab3c3e45d847a73028d9c3": components["schemas"]["BidPlacementResponse"];
    "6383e51ee52c0c02bb879720dd1369ff": components["schemas"]["AccountProfile"];
    "6a66905fa98d3338490e0e1fa319f020": components["schemas"]["AuctionSummary"][];
    /** @description Invalid schema placeholder from source: wonauctiondetail */
    "701cfa5771768716c533d79a64c9de4e": {
      [key: string]: unknown;
    };
    "73ecc0629092579294659b44067a079e": {
      message?: string;
    };
    "78da01e9c4466fd305f19c38c1a268aa": components["schemas"]["PaymentRefundRequest"];
    "797b200d569c2326e602789cf5857a55": {
      is_admin?: boolean;
      is_superuser?: boolean;
      remaining_seconds?: number;
      session_expires_at?: string;
      session_token_id?: number;
      user?: Record<string, never>;
    };
    "8f2da65cfba791e94dd2ba283fcaf20b": components["schemas"]["AuctionUpsert"];
    "8fcf44720df100dc78c3cb161689ebb0": components["schemas"]["RefreshRequest"];
    "92391726031d167dc21005ee2680953a": components["schemas"]["Auction"];
    /** @description Invalid schema placeholder from source: walletbalance */
    "92a957eccee8f5d76aa3a12647cfa5fd": {
      [key: string]: unknown;
    };
    "9862e02456e496d619bf8d0e1f385fb1": components["schemas"]["NotificationPreferencesResponse"];
    AccountDeleteRequest:
      | {
          account: {
            /** @enum {string} */
            confirmation: "DELETE";
            current_password: string;
          };
        }
      | {
          /** @enum {string} */
          confirmation: "DELETE";
          current_password: string;
        };
    AccountExport: {
      data?: {
        [key: string]: unknown;
      } | null;
      download_url?: string | null;
      id: number;
      /** Format: date-time */
      ready_at?: string | null;
      /** Format: date-time */
      requested_at: string;
      /** @enum {string} */
      status: "pending" | "ready" | "failed";
    };
    AccountExportResponse: {
      export: components["schemas"]["AccountExport"] | null;
    };
    AccountProfile: {
      user: {
        /** Format: date-time */
        created_at: string;
        /** Format: email */
        email_address: string;
        email_verified: boolean;
        /** Format: date-time */
        email_verified_at?: string | null;
        id: number;
        name?: string | null;
        notification_preferences: components["schemas"]["NotificationPreferences"];
      };
    };
    AccountSecurity: {
      security: {
        /** Format: email */
        email_address: string;
        /** Format: date-time */
        email_verification_sent_at?: string | null;
        email_verified: boolean;
        /** Format: date-time */
        email_verified_at?: string | null;
        /** Format: email */
        unverified_email_address?: string | null;
      };
    };
    AccountSession: {
      /** Format: date-time */
      created_at: string;
      current: boolean;
      id: number;
      ip_address?: string | null;
      /** Format: date-time */
      last_seen_at?: string | null;
      user_agent?: string | null;
    };
    AccountSessionsResponse: {
      sessions: components["schemas"]["AccountSession"][];
    };
    AccountUpdateRequest: {
      account: {
        name: string;
      };
    };
    AdminUserUpdate: {
      user: {
        /** Format: email */
        email_address?: string | null;
        name?: string | null;
        role?: string | null;
      };
    };
    /** @description Full auction details including pricing and winner information. */
    Auction: {
      bids?: components["schemas"]["Bid"][] | null;
      /** Format: float */
      current_price: number;
      description: string;
      /** Format: date-time */
      end_time: string;
      highest_bidder_id?: number | null;
      id: number;
      image_url?: string | null;
      /** Format: date-time */
      start_date: string;
      /** @enum {string} */
      status: "inactive" | "scheduled" | "active" | "complete" | "cancelled";
      title: string;
      winning_user_id?: number | null;
      winning_user_name?: string | null;
    };
    /** @description Slimmer auction representation for list views to reduce payload size. */
    AuctionSummary: {
      /** Format: float */
      current_price: number;
      /** Format: date-time */
      end_time: string;
      id: number;
      image_url?: string | null;
      /** @enum {string} */
      status: "inactive" | "scheduled" | "active" | "complete" | "cancelled";
      title: string;
      winning_user_id?: number | null;
      winning_user_name?: string | null;
    };
    /** @description Attributes accepted when creating or updating an auction via admin endpoints. */
    AuctionUpsert: {
      auction: {
        /** Format: float */
        current_price?: number | null;
        description: string;
        /** Format: date-time */
        end_time?: string | null;
        image_url?: string | null;
        /** Format: date-time */
        start_date?: string | null;
        /** @enum {string|null} */
        status?:
          | "inactive"
          | "scheduled"
          | "active"
          | "complete"
          | "cancelled"
          | null;
        title: string;
      };
    };
    AuditLogCreate: {
      audit: {
        action: string;
        payload?: {
          [key: string]: unknown;
        };
        target_id?: number | null;
        target_type?: string | null;
      };
    };
    /** @description A single bid placed against an auction. */
    Bid: {
      /** Format: float */
      amount: number;
      auction_id?: number | null;
      /** Format: date-time */
      created_at: string;
      id: number;
      user_id: number;
      username: string;
    };
    /** @description Bid history entry with bidder display name. */
    BidHistoryItem: {
      /** Format: float */
      amount: number;
      /** Format: date-time */
      created_at: string;
      id: number;
      user_id: number;
      username: string;
    };
    /** @description Envelope returned from bid history endpoints. */
    BidHistoryResponse: {
      auction: {
        winning_user_id?: number | null;
        winning_user_name?: string | null;
      };
      bids: components["schemas"]["BidHistoryItem"][];
    };
    /** @description Information about a purchasable bid pack. */
    BidPack: {
      active: boolean;
      /** @description Number of bids included. */
      bids: number;
      description?: string | null;
      highlight?: boolean | null;
      id: number;
      name: string;
      /** Format: float */
      price: number;
      pricePerBid?: string;
      /** @enum {string} */
      status: "active" | "retired";
    };
    /** @description Attributes accepted when creating or updating bid packs via admin endpoints. */
    BidPackUpsert: {
      bid_pack: {
        active?: boolean | null;
        bids: number;
        description?: string | null;
        highlight?: boolean | null;
        name: string;
        /** Format: float */
        price: number;
        /** @enum {string|null} */
        status?: "active" | "retired" | null;
      };
    };
    /** @description Response envelope returned after placing a bid. */
    BidPlacementResponse: {
      bid: components["schemas"]["Bid"];
      bidCredits: number;
      success: boolean;
    };
    ChangeEmailRequest:
      | {
          email: {
            current_password: string;
            /** Format: email */
            new_email_address: string;
          };
        }
      | {
          current_password: string;
          /** Format: email */
          new_email_address: string;
        };
    ChangePasswordRequest:
      | {
          password: {
            current_password: string;
            new_password: string;
          };
        }
      | {
          current_password: string;
          new_password: string;
        };
    /** @description Stripe checkout session details used to complete purchases. */
    CheckoutSession: {
      /** @description Client secret used to render the Stripe checkout flow. */
      clientSecret: string;
      message?: string | null;
      payment_status?: string | null;
      status?: string | null;
      updated_bid_credits?: number | null;
    };
    /** @description Standard error envelope returned by all error responses. error_code maps to ServiceResult#code or controller error codes. */
    Error: {
      details?:
        | (
            | {
                [key: string]: unknown;
              }
            | unknown[]
          )
        | null;
      /**
       * @description Symbol/string code derived from ServiceResult#code so clients can branch on error type.
       * @enum {string}
       */
      error_code:
        | "forbidden"
        | "not_found"
        | "bad_request"
        | "invalid_status"
        | "invalid_state"
        | "invalid_auction"
        | "invalid_bid_pack"
        | "invalid_payment"
        | "invalid_amount"
        | "amount_exceeds_charge"
        | "gateway_error"
        | "database_error"
        | "unexpected_error"
        | "validation_error"
        | "auction_not_active"
        | "insufficient_credits"
        | "bid_race_lost"
        | "bid_invalid"
        | "bid_pack_purchase_failed"
        | "invalid_credentials"
        | "invalid_session"
        | "account_disabled"
        | "invalid_token"
        | "invalid_password"
        | "invalid_email"
        | "invalid_user"
        | "invalid_delta"
        | "already_disabled"
        | "already_verified"
        | "already_refunded"
        | "rate_limited"
        | "retired"
        | "missing_payment_intent";
      message: string;
    };
    /** @description Login payload accepted by /api/v1/login (nested or flat). */
    LoginRequest:
      | {
          session: {
            /** Format: email */
            email_address: string;
            password: string;
          };
        }
      | {
          /** Format: email */
          email_address: string;
          password: string;
        }
      | {
          /** Format: email */
          emailAddress: string;
          password: string;
        };
    MaintenanceToggle: {
      enabled: boolean;
    };
    /** @description User notification preferences (all boolean flags). */
    NotificationPreferences: {
      bidding_alerts: boolean;
      marketing_emails: boolean;
      outbid_alerts: boolean;
      product_updates: boolean;
      receipts: boolean;
      watched_auction_ending: boolean;
    };
    NotificationPreferencesResponse: {
      notification_preferences: components["schemas"]["NotificationPreferences"];
    };
    NotificationPreferencesUpdateRequest: {
      account: {
        notification_preferences: components["schemas"]["NotificationPreferences"];
      };
    };
    PaymentRefundRequest: {
      amount_cents?: number;
      reason?: string | null;
    };
    /** @description Bid-pack purchase record for the current user. */
    Purchase: {
      amount_cents: number;
      bid_pack: {
        credits: number;
        id: number;
        name: string;
        price_cents: number;
      };
      /** Format: date-time */
      created_at: string;
      currency: string;
      id: number;
      /** @enum {string} */
      receipt_status: "pending" | "available" | "unavailable";
      /** Format: uri */
      receipt_url?: string | null;
      /** @enum {string} */
      status:
        | "pending"
        | "completed"
        | "partially_refunded"
        | "refunded"
        | "voided"
        | "failed";
      stripe_checkout_session_id?: string | null;
      stripe_payment_intent_id?: string | null;
    };
    /** @description Session refresh payload accepted by /api/v1/session/refresh (nested or flat). */
    RefreshRequest:
      | {
          session: {
            refresh_token: string;
          };
        }
      | {
          refresh_token: string;
        }
      | {
          refreshToken: string;
        };
    /** @description User registration payload accepted by /api/v1/signup (and legacy /api/v1/users). */
    SignupRequest:
      | {
          user: {
            /** Format: email */
            email_address: string;
            name: string;
            password: string;
            password_confirmation: string;
          };
        }
      | {
          /** Format: email */
          email_address: string;
          name: string;
          password: string;
          password_confirmation: string;
        };
    /** @description Session details and tokens returned after login/refresh. */
    UserSession: {
      is_admin: boolean;
      is_superuser: boolean;
      redirect_path: string | null;
      refresh_token: string;
      session: {
        seconds_remaining: number;
        /** Format: date-time */
        session_expires_at: string;
        session_token_id: number;
      };
      session_token_id: number;
      /** @description JWT used for authenticated requests. */
      token: string;
      user: {
        bidCredits: number;
        /** Format: email */
        emailAddress: string;
        id: number;
        is_admin?: boolean;
        is_superuser?: boolean;
        name: string;
        role: string;
      };
    };
    /** @description Validation error payload returned when user input is invalid. */
    ValidationErrors: {
      errors: string[];
    };
    a077befc92201cc9817e570d6ae70b40: {
      [key: string]: unknown;
    }[];
    a5a373a545e3cb0ecbc6b5a1ef83a993: {
      maintenance?: {
        enabled?: boolean;
        updated_at?: string;
      };
    };
    a81c845cacc4c45e88a92b3134ba586b: Record<string, never>;
    a9e1a606eb82c3fa25a4df4f74ec3380: components["schemas"]["AuditLogCreate"];
    ac552b948996489944d9b1c178477677: {
      data: Record<string, never>;
      id: number;
      kind: string;
      /** Format: date-time */
      read_at: string | null;
    }[];
    b6f9ed4b3630fb2e02eba22dced97fac: components["schemas"]["CheckoutSession"];
    baee3b1db606d749e58b0bc1b6fe9095: components["schemas"]["Purchase"];
    d79407304a1f91dbdcfa03f0d06dc75e: {
      error?: string;
      status: number;
    };
    ddaf05b3867210b395551e23d4d571d8: components["schemas"]["Auction"][];
    dfa5b43a7ec1e69f60149bf0d37749f8: components["schemas"]["NotificationPreferencesUpdateRequest"];
    ef3de6c4897996a5c3c5037fab28f26a: {
      user?: Record<string, never>;
    };
    f009e6be2776100ca0e0a85b276069e1: components["schemas"]["BidPack"];
    f1c20ccef0049507184555a5f2ee6723: {
      status?: string;
    };
    f2665844cf5f03dc4ddfa6080cc97647: components["schemas"]["AccountSecurity"];
    f8ac92928e658c77a32eae4ed5b9ea93: components["schemas"]["AccountUpdateRequest"];
    fc208d7705ebd47b7b4f9cba41ec4d24: components["schemas"]["Purchase"][];
    fca7ae9c5b5a5fdbca32473db8333bdf: components["schemas"]["SignupRequest"];
    fd0dd4b96d26e41ffa16eb08756286bc: components["schemas"]["ChangeEmailRequest"];
    feca50860d589971172a2b752bbc787f: components["schemas"]["BidHistoryResponse"];
  };
  responses: {
    /** @description Bid pack updated */
    resp_001: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["f009e6be2776100ca0e0a85b276069e1"];
      };
    };
    /** @description Not found */
    resp_002: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["3e47d336c6c6a6fa077f7f17876e56f1"];
      };
    };
    /** @description Password reset */
    resp_003: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["73ecc0629092579294659b44067a079e"];
      };
    };
    /** @description Session created */
    resp_004: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["09eda044efad4320218b100180234bec"];
      };
    };
    /** @description Audit logged */
    resp_005: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["f1c20ccef0049507184555a5f2ee6723"];
      };
    };
    /** @description Success */
    resp_006: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["2d935b114de85d13479f1b86247e8262"];
      };
    };
    /** @description Auction found */
    resp_007: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["92391726031d167dc21005ee2680953a"];
      };
    };
    /** @description Session valid */
    resp_008: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["09eda044efad4320218b100180234bec"];
      };
    };
    /** @description Session timing */
    resp_009: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["797b200d569c2326e602789cf5857a55"];
      };
    };
    /** @description Bid pack created */
    resp_010: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["f009e6be2776100ca0e0a85b276069e1"];
      };
    };
    /** @description Wins */
    resp_011: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["a077befc92201cc9817e570d6ae70b40"];
      };
    };
    /** @description Purchases */
    resp_012: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["fc208d7705ebd47b7b4f9cba41ec4d24"];
      };
    };
    /** @description Auction extended */
    resp_013: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["92391726031d167dc21005ee2680953a"];
      };
    };
    /** @description Bid history */
    resp_014: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["feca50860d589971172a2b752bbc787f"];
      };
    };
    /** @description Session refreshed */
    resp_015: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["09eda044efad4320218b100180234bec"];
      };
    };
    /** @description Unprocessable content */
    resp_016: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["3e47d336c6c6a6fa077f7f17876e56f1"];
      };
    };
    /** @description Admin auctions */
    resp_017: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["ddaf05b3867210b395551e23d4d571d8"];
      };
    };
    /** @description Bid packs */
    resp_018: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["195fee13a2e676e36bcaf119071f3cc9"];
      };
    };
    /** @description Payments */
    resp_019: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["1d72cc17842046d9c1a343fb85baa2bc"];
      };
    };
    /** @description Bad request */
    resp_020: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["3e47d336c6c6a6fa077f7f17876e56f1"];
      };
    };
    /** @description An unexpected error occurred on the server. The server was unable to process the request. */
    resp_021: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["d79407304a1f91dbdcfa03f0d06dc75e"];
      };
    };
    /** @description Auctions */
    resp_022: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["6a66905fa98d3338490e0e1fa319f020"];
      };
    };
    /** @description Wallet balance */
    resp_023: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["92a957eccee8f5d76aa3a12647cfa5fd"];
      };
    };
    /** @description Role updated */
    resp_024: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["2fcd9b5aab073fe3e7e089bfc0ede365"];
      };
    };
    /** @description Auction updated */
    resp_025: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["92391726031d167dc21005ee2680953a"];
      };
    };
    /** @description User updated */
    resp_026: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["2fcd9b5aab073fe3e7e089bfc0ede365"];
      };
    };
    /** @description Success */
    resp_027: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["f2665844cf5f03dc4ddfa6080cc97647"];
      };
    };
    /** @description Refund issued */
    resp_028: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["071d7542ed3e657e63c9bbdfb6c66c5e"];
      };
    };
    /** @description Accepted */
    resp_029: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["0cc56eaebe1128597970f1e9d17d5db5"];
      };
    };
    /** @description Success */
    resp_030: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["a81c845cacc4c45e88a92b3134ba586b"];
      };
    };
    /** @description Wallet transactions */
    resp_031: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["0b27bc2d4f067d7b4e46fc6fbfbaf4c2"];
      };
    };
    /** @description Win claimed */
    resp_032: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["701cfa5771768716c533d79a64c9de4e"];
      };
    };
    /** @description Already processed */
    resp_033: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["b6f9ed4b3630fb2e02eba22dced97fac"];
      };
    };
    /** @description Success */
    resp_034: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["9862e02456e496d619bf8d0e1f385fb1"];
      };
    };
    /** @description Template */
    resp_035: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["f009e6be2776100ca0e0a85b276069e1"];
      };
    };
    /** @description Maintenance updated */
    resp_036: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["a5a373a545e3cb0ecbc6b5a1ef83a993"];
      };
    };
    /** @description Success */
    resp_037: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["f1c20ccef0049507184555a5f2ee6723"];
      };
    };
    /** @description Win */
    resp_038: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["701cfa5771768716c533d79a64c9de4e"];
      };
    };
    /** @description Updated */
    resp_039: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["6383e51ee52c0c02bb879720dd1369ff"];
      };
    };
    /** @description You are not authorized to access this resource. You need to authenticate yourself first. */
    resp_040: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["d79407304a1f91dbdcfa03f0d06dc75e"];
      };
    };
    /** @description Bid pack */
    resp_041: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["f009e6be2776100ca0e0a85b276069e1"];
      };
    };
    /** @description The requested resource could not be found. */
    resp_042: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["d79407304a1f91dbdcfa03f0d06dc75e"];
      };
    };
    /** @description Validation error */
    resp_043: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["3e47d336c6c6a6fa077f7f17876e56f1"];
      };
    };
    /** @description Current user */
    resp_044: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["ef3de6c4897996a5c3c5037fab28f26a"];
      };
    };
    /** @description Bid pack retired */
    resp_045: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["f009e6be2776100ca0e0a85b276069e1"];
      };
    };
    /** @description You are not allowed to access this resource. You do not have the necessary permissions. */
    resp_046: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["d79407304a1f91dbdcfa03f0d06dc75e"];
      };
    };
    /** @description Purchase */
    resp_047: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["baee3b1db606d749e58b0bc1b6fe9095"];
      };
    };
    /** @description The server could not process the request due to semantic errors. Please check your input and try again. */
    resp_048: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["d79407304a1f91dbdcfa03f0d06dc75e"];
      };
    };
    /** @description Success */
    resp_049: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["0cc56eaebe1128597970f1e9d17d5db5"];
      };
    };
    /** @description Logged out */
    resp_050: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["f1c20ccef0049507184555a5f2ee6723"];
      };
    };
    /** @description Forbidden */
    resp_051: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["3e47d336c6c6a6fa077f7f17876e56f1"];
      };
    };
    /** @description Checkout session created */
    resp_052: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["b6f9ed4b3630fb2e02eba22dced97fac"];
      };
    };
    /** @description User banned */
    resp_053: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["2fcd9b5aab073fe3e7e089bfc0ede365"];
      };
    };
    /** @description Checkout status */
    resp_054: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["b6f9ed4b3630fb2e02eba22dced97fac"];
      };
    };
    /** @description Notifications */
    resp_055: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["ac552b948996489944d9b1c178477677"];
      };
    };
    /** @description Purchase applied */
    resp_056: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["b6f9ed4b3630fb2e02eba22dced97fac"];
      };
    };
    /** @description Success */
    resp_057: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["48ae3f28abfc1838fe5cc1decd11167c"];
      };
    };
    /** @description Bid placed */
    resp_058: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["6175057dd6ab3c3e45d847a73028d9c3"];
      };
    };
    /** @description Auction retired */
    resp_059: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["183f737b640374d4f693193012fa6154"];
      };
    };
    /** @description Unprocessable content */
    resp_060: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["0c805fddae341e8fec983e81eca5ba05"];
      };
    };
    /** @description Too many requests */
    resp_061: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["3e47d336c6c6a6fa077f7f17876e56f1"];
      };
    };
    /** @description Admin users */
    resp_062: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["0c90018525308fa74a5c4563f158a360"];
      };
    };
    /** @description Auction created */
    resp_063: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["92391726031d167dc21005ee2680953a"];
      };
    };
    /** @description Accepted */
    resp_064: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["f1c20ccef0049507184555a5f2ee6723"];
      };
    };
    /** @description Unauthorized */
    resp_065: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["3e47d336c6c6a6fa077f7f17876e56f1"];
      };
    };
    /** @description Maintenance status */
    resp_066: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["a5a373a545e3cb0ecbc6b5a1ef83a993"];
      };
    };
    /** @description Success */
    resp_067: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["6383e51ee52c0c02bb879720dd1369ff"];
      };
    };
  };
  parameters: {
    /** @description ID of the auction */
    "08c34767a5405f30927bbac7a3c4fc71": number;
    /** @description Page number for pagination */
    "0abd227a13448d9299e1c1de37060965": number;
    /** @description ID of the user */
    "1ab6dc819a121c51b85fe92cef981390": number;
    /** @description Sort direction (asc or desc) */
    "2f283202ff70ebb99d8bc91461022917": string;
    /** @description Sort column (e.g., start_date, end_time) */
    "3351e2e3c00563360e4e4fd54846fd80": string;
    /** @description ID of the payment */
    "3c3ce4ffa8cd4a597cfcbc9686ae2240": number;
    /** @description Filter by status (allowed: inactive, scheduled, active, complete, cancelled) */
    "3c76e0904ddc71e0dcc8562e902e37e4": string;
    /** @description Page number (1-indexed) */
    "4b8201d282702e38320140ce419db69c": number;
    /** @description Set to true to enable maintenance mode (optional if provided in body) */
    "4d8a0e115b89a8f46b84d94493a18636": boolean;
    /** @description Id of existing payment. */
    "69c0d7704ead151b48aa2783eb58caba": string;
    /** @description Id of existing win. */
    "6d2922b757358bf49bc76b1d1dbd2d51": string;
    /** @description ID of the auction */
    "6e0158f0b618754c963898ab74806752": number;
    /** @description Id of existing fulfillment. */
    "777694c3b434f8ee8851ce24570d1fa4": string;
    /** @description Filter payments by user email substring */
    "824c479f1b10dd39acc3ac03aaf34dc6": string;
    /** @description Page size (default 25, max 100) */
    "8b577654ea2cfd842be3fdfd02ff6509": number;
    /** @description ID of the bid pack */
    "8d0599f85a9865e57a0e4ad8eacd5beb": number;
    /** @description Id of existing auction. */
    "98630f24a9e2ae556ba92595202094b3": string;
    /** @description ISO8601 upper bound for start date */
    a841405d71064dbcce48f7d27ae6a081: string;
    /** @description ISO8601 lower bound for start date */
    af0db788db137a22186baada5847a117: string;
    /** @description Email verification token */
    b5e011eb97af026f0de4a08c94735bc7: string;
    /** @description Session token ID */
    b616e3297225d84121c506134222a819: number;
    /** @description ID of the Stripe checkout session */
    c96cce3d59cd4fa44833d2fd8dcb937c: string;
    /** @description ID of the bid pack to purchase */
    e47fcdce1e2038e964734571e689bfeb: number;
    /** @description Search by title or description */
    efcd9d2952f804307e8ffce6decf5e94: string;
    /** @description Id of existing purchase. */
    f1b9d71bc5c9d7c5d3b7d0c3e3d4faa8: string;
    /** @description Number of records per page */
    fa14d9ed9953c24b7ca86e0fc8af5f19: number;
  };
  requestBodies: {
    /** @description Update payload */
    req_001: {
      content: {
        "application/json": components["schemas"]["f8ac92928e658c77a32eae4ed5b9ea93"];
      };
    };
    /** @description Refresh payload */
    req_002: {
      content: {
        "application/json": components["schemas"]["8fcf44720df100dc78c3cb161689ebb0"];
      };
    };
    /** @description Auction payload */
    req_003: {
      content: {
        "application/json": components["schemas"]["8f2da65cfba791e94dd2ba283fcaf20b"];
      };
    };
    /** @description Login payload */
    req_004: {
      content: {
        "application/json": components["schemas"]["276c024e8515065c3bec759819bda57c"];
      };
    };
    /** @description Refund payload */
    req_005: {
      content: {
        "application/json": components["schemas"]["78da01e9c4466fd305f19c38c1a268aa"];
      };
    };
    /** @description Change email payload */
    req_006: {
      content: {
        "application/json": components["schemas"]["fd0dd4b96d26e41ffa16eb08756286bc"];
      };
    };
    /** @description Update preferences payload */
    req_007: {
      content: {
        "application/json": components["schemas"]["dfa5b43a7ec1e69f60149bf0d37749f8"];
      };
    };
    /** @description Delete account payload */
    req_008: {
      content: {
        "application/json": components["schemas"]["264961f1d98ca80176fc486fdf41eaba"];
      };
    };
    /** @description Admin user payload */
    req_009: {
      content: {
        "application/json": components["schemas"]["3b6a8f53a53c0471294532bfc2aa40b3"];
      };
    };
    /** @description Change password payload */
    req_010: {
      content: {
        "application/json": components["schemas"]["5fa0310957b5c0b33595a49f03b95e19"];
      };
    };
    /** @description Bid pack payload */
    req_011: {
      content: {
        "application/json": components["schemas"]["0ff4072fbad423c5d8e556357b2a12e7"];
      };
    };
    /** @description Audit payload */
    req_012: {
      content: {
        "application/json": components["schemas"]["a9e1a606eb82c3fa25a4df4f74ec3380"];
      };
    };
    /** @description Maintenance toggle */
    req_013: {
      content: {
        "application/json": components["schemas"]["30d3c70eaf62d1e420cb43b97fdec55f"];
      };
    };
    /** @description Signup payload */
    req_014: {
      content: {
        "application/json": components["schemas"]["fca7ae9c5b5a5fdbca32473db8333bdf"];
      };
    };
  };
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  GET__: {
    parameters: {
      query?: {
        /** @description Filter by status (allowed: inactive, scheduled, active, complete, cancelled) */
        status?: components["parameters"]["3c76e0904ddc71e0dcc8562e902e37e4"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_022"];
      422: components["responses"]["resp_043"];
    };
  };
  GET__api_v1_account: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_067"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_042"];
      500: components["responses"]["resp_021"];
    };
  };
  PUT__api_v1_account: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_001"];
    responses: {
      200: components["responses"]["resp_039"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_042"];
      422: components["responses"]["resp_016"];
      500: components["responses"]["resp_021"];
    };
  };
  DELETE__api_v1_account: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_008"];
    responses: {
      200: components["responses"]["resp_037"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_042"];
      422: components["responses"]["resp_016"];
      500: components["responses"]["resp_021"];
    };
  };
  PATCH__api_v1_account: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_001"];
    responses: {
      200: components["responses"]["resp_039"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_042"];
      422: components["responses"]["resp_016"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_account_data_export: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_049"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_042"];
      500: components["responses"]["resp_021"];
    };
  };
  POST__api_v1_account_data_export: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      202: components["responses"]["resp_029"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      422: components["responses"]["resp_048"];
      500: components["responses"]["resp_021"];
    };
  };
  "POST__api_v1_account_email-change": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_006"];
    responses: {
      202: components["responses"]["resp_064"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      422: components["responses"]["resp_016"];
      429: components["responses"]["resp_061"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_account_export: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_030"];
      202: components["responses"]["resp_029"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_account_notifications: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_034"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_042"];
      500: components["responses"]["resp_021"];
    };
  };
  PUT__api_v1_account_notifications: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_007"];
    responses: {
      200: components["responses"]["resp_034"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_042"];
      422: components["responses"]["resp_016"];
      500: components["responses"]["resp_021"];
    };
  };
  POST__api_v1_account_password: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_010"];
    responses: {
      200: components["responses"]["resp_057"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      422: components["responses"]["resp_016"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_account_security: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_027"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_042"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_account_sessions: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_006"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      500: components["responses"]["resp_021"];
    };
  };
  DELETE__api_v1_account_sessions: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_057"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      500: components["responses"]["resp_021"];
    };
  };
  POST__api_v1_account_sessions_revoke_others: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_057"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      500: components["responses"]["resp_021"];
    };
  };
  "DELETE__api_v1_account_sessions_{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Session token ID */
        id: components["parameters"]["b616e3297225d84121c506134222a819"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_037"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_042"];
      422: components["responses"]["resp_016"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_admin_auctions: {
    parameters: {
      query?: {
        /** @description Filter by status (allowed: inactive, scheduled, active, complete, cancelled) */
        status?: components["parameters"]["3c76e0904ddc71e0dcc8562e902e37e4"];
        /** @description Search by title or description */
        search?: components["parameters"]["efcd9d2952f804307e8ffce6decf5e94"];
        /** @description ISO8601 lower bound for start date */
        start_date_from?: components["parameters"]["af0db788db137a22186baada5847a117"];
        /** @description ISO8601 upper bound for start date */
        start_date_to?: components["parameters"]["a841405d71064dbcce48f7d27ae6a081"];
        /** @description Sort column (e.g., start_date, end_time) */
        sort?: components["parameters"]["3351e2e3c00563360e4e4fd54846fd80"];
        /** @description Sort direction (asc or desc) */
        direction?: components["parameters"]["2f283202ff70ebb99d8bc91461022917"];
        /** @description Page number for pagination */
        page?: components["parameters"]["0abd227a13448d9299e1c1de37060965"];
        /** @description Number of records per page */
        per_page?: components["parameters"]["fa14d9ed9953c24b7ca86e0fc8af5f19"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_017"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      500: components["responses"]["resp_021"];
    };
  };
  "GET__api_v1_admin_auctions_{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the auction */
        id: components["parameters"]["08c34767a5405f30927bbac7a3c4fc71"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_007"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      500: components["responses"]["resp_021"];
    };
  };
  POST__api_v1_admin_audit: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_012"];
    responses: {
      201: components["responses"]["resp_005"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "GET__api_v1_admin_bid-packs": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_018"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      500: components["responses"]["resp_021"];
    };
  };
  "POST__api_v1_admin_bid-packs": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_011"];
    responses: {
      201: components["responses"]["resp_010"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "GET__api_v1_admin_bid-packs_new": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_035"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      500: components["responses"]["resp_021"];
    };
  };
  "GET__api_v1_admin_bid-packs_{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the bid pack */
        id: components["parameters"]["8d0599f85a9865e57a0e4ad8eacd5beb"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_041"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      500: components["responses"]["resp_021"];
    };
  };
  "PUT__api_v1_admin_bid-packs_{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the bid pack */
        id: components["parameters"]["8d0599f85a9865e57a0e4ad8eacd5beb"];
      };
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_011"];
    responses: {
      200: components["responses"]["resp_001"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "DELETE__api_v1_admin_bid-packs_{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the bid pack */
        id: components["parameters"]["8d0599f85a9865e57a0e4ad8eacd5beb"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_045"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "PATCH__api_v1_admin_bid-packs_{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the bid pack */
        id: components["parameters"]["8d0599f85a9865e57a0e4ad8eacd5beb"];
      };
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_011"];
    responses: {
      200: components["responses"]["resp_001"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "GET__api_v1_admin_bid-packs_{id}_edit": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the bid pack */
        id: components["parameters"]["8d0599f85a9865e57a0e4ad8eacd5beb"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_041"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      500: components["responses"]["resp_021"];
    };
  };
  "POST__api_v1_admin_fulfillments_{id}_complete": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Id of existing fulfillment. */
        id: components["parameters"]["777694c3b434f8ee8851ce24570d1fa4"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      401: components["responses"]["resp_040"];
      403: components["responses"]["resp_046"];
      500: components["responses"]["resp_021"];
    };
  };
  "POST__api_v1_admin_fulfillments_{id}_process": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Id of existing fulfillment. */
        id: components["parameters"]["777694c3b434f8ee8851ce24570d1fa4"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      401: components["responses"]["resp_040"];
      403: components["responses"]["resp_046"];
      500: components["responses"]["resp_021"];
    };
  };
  "POST__api_v1_admin_fulfillments_{id}_ship": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Id of existing fulfillment. */
        id: components["parameters"]["777694c3b434f8ee8851ce24570d1fa4"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      401: components["responses"]["resp_040"];
      403: components["responses"]["resp_046"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_admin_maintenance: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_066"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_042"];
      500: components["responses"]["resp_021"];
    };
  };
  POST__api_v1_admin_maintenance: {
    parameters: {
      query?: {
        /** @description Set to true to enable maintenance mode (optional if provided in body) */
        enabled?: components["parameters"]["4d8a0e115b89a8f46b84d94493a18636"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: components["requestBodies"]["req_013"];
    responses: {
      200: components["responses"]["resp_036"];
      400: components["responses"]["resp_020"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_042"];
      422: components["responses"]["resp_048"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_admin_payments: {
    parameters: {
      query?: {
        /** @description Filter payments by user email substring */
        search?: components["parameters"]["824c479f1b10dd39acc3ac03aaf34dc6"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_019"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      500: components["responses"]["resp_021"];
    };
  };
  "GET__api_v1_admin_payments_{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Id of existing payment. */
        id: components["parameters"]["69c0d7704ead151b48aa2783eb58caba"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      401: components["responses"]["resp_040"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_042"];
      500: components["responses"]["resp_021"];
    };
  };
  "POST__api_v1_admin_payments_{id}_refund": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the payment */
        id: components["parameters"]["3c3ce4ffa8cd4a597cfcbc9686ae2240"];
      };
      cookie?: never;
    };
    requestBody?: components["requestBodies"]["req_005"];
    responses: {
      200: components["responses"]["resp_028"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "POST__api_v1_admin_payments_{id}_repair_credits": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Id of existing payment. */
        id: components["parameters"]["69c0d7704ead151b48aa2783eb58caba"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      401: components["responses"]["resp_040"];
      403: components["responses"]["resp_046"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_admin_users: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_062"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      500: components["responses"]["resp_021"];
    };
  };
  "PUT__api_v1_admin_users_{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the user */
        id: components["parameters"]["1ab6dc819a121c51b85fe92cef981390"];
      };
      cookie?: never;
    };
    requestBody?: components["requestBodies"]["req_009"];
    responses: {
      200: components["responses"]["resp_026"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "PATCH__api_v1_admin_users_{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the user */
        id: components["parameters"]["1ab6dc819a121c51b85fe92cef981390"];
      };
      cookie?: never;
    };
    requestBody?: components["requestBodies"]["req_009"];
    responses: {
      200: components["responses"]["resp_026"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "POST__api_v1_admin_users_{id}_ban": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the user */
        id: components["parameters"]["1ab6dc819a121c51b85fe92cef981390"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_053"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "POST__api_v1_admin_users_{id}_grant_admin": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the user */
        id: components["parameters"]["1ab6dc819a121c51b85fe92cef981390"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_024"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "POST__api_v1_admin_users_{id}_grant_superadmin": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the user */
        id: components["parameters"]["1ab6dc819a121c51b85fe92cef981390"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_024"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "POST__api_v1_admin_users_{id}_revoke_admin": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the user */
        id: components["parameters"]["1ab6dc819a121c51b85fe92cef981390"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_024"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "POST__api_v1_admin_users_{id}_revoke_superadmin": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the user */
        id: components["parameters"]["1ab6dc819a121c51b85fe92cef981390"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_024"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_auctions: {
    parameters: {
      query?: {
        /** @description Filter by status (allowed: inactive, scheduled, active, complete, cancelled) */
        status?: components["parameters"]["3c76e0904ddc71e0dcc8562e902e37e4"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_022"];
      422: components["responses"]["resp_043"];
    };
  };
  POST__api_v1_auctions: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_003"];
    responses: {
      201: components["responses"]["resp_063"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "GET__api_v1_auctions_{auction_id}_bid_history": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the auction */
        auction_id: components["parameters"]["6e0158f0b618754c963898ab74806752"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_014"];
      404: components["responses"]["resp_002"];
    };
  };
  "POST__api_v1_auctions_{auction_id}_bids": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the auction */
        auction_id: components["parameters"]["6e0158f0b618754c963898ab74806752"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_058"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "GET__api_v1_auctions_{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the auction */
        id: components["parameters"]["08c34767a5405f30927bbac7a3c4fc71"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_007"];
      404: components["responses"]["resp_002"];
    };
  };
  "PUT__api_v1_auctions_{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the auction */
        id: components["parameters"]["08c34767a5405f30927bbac7a3c4fc71"];
      };
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_003"];
    responses: {
      200: components["responses"]["resp_025"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "DELETE__api_v1_auctions_{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the auction */
        id: components["parameters"]["08c34767a5405f30927bbac7a3c4fc71"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      204: components["responses"]["resp_059"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "PATCH__api_v1_auctions_{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the auction */
        id: components["parameters"]["08c34767a5405f30927bbac7a3c4fc71"];
      };
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_003"];
    responses: {
      200: components["responses"]["resp_025"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "POST__api_v1_auctions_{id}_extend_time": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the auction */
        id: components["parameters"]["08c34767a5405f30927bbac7a3c4fc71"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_013"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  "POST__api_v1_auctions_{id}_watch": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Id of existing auction. */
        id: components["parameters"]["98630f24a9e2ae556ba92595202094b3"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      401: components["responses"]["resp_040"];
      403: components["responses"]["resp_046"];
      422: components["responses"]["resp_048"];
      500: components["responses"]["resp_021"];
    };
  };
  "DELETE__api_v1_auctions_{id}_watch": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Id of existing auction. */
        id: components["parameters"]["98630f24a9e2ae556ba92595202094b3"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      401: components["responses"]["resp_040"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_042"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_bid_packs: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_018"];
    };
  };
  GET__api_v1_checkout_status: {
    parameters: {
      query?: {
        /** @description ID of the Stripe checkout session */
        session_id?: components["parameters"]["c96cce3d59cd4fa44833d2fd8dcb937c"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_054"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_002"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_checkout_success: {
    parameters: {
      query?: {
        /** @description ID of the Stripe checkout session */
        session_id?: components["parameters"]["c96cce3d59cd4fa44833d2fd8dcb937c"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_056"];
      208: components["responses"]["resp_033"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  POST__api_v1_checkouts: {
    parameters: {
      query?: {
        /** @description ID of the bid pack to purchase */
        bid_pack_id?: components["parameters"]["e47fcdce1e2038e964734571e689bfeb"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_052"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  POST__api_v1_email_verifications_resend: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      202: components["responses"]["resp_064"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      429: components["responses"]["resp_061"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_email_verifications_verify: {
    parameters: {
      query?: {
        /** @description Email verification token */
        token?: components["parameters"]["b5e011eb97af026f0de4a08c94735bc7"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_037"];
      422: components["responses"]["resp_016"];
    };
  };
  GET__api_v1_logged_in: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_008"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      500: components["responses"]["resp_021"];
    };
  };
  POST__api_v1_login: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_004"];
    responses: {
      200: components["responses"]["resp_004"];
      400: components["responses"]["resp_020"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      422: components["responses"]["resp_048"];
    };
  };
  DELETE__api_v1_logout: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_050"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_042"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_maintenance: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_066"];
      404: components["responses"]["resp_042"];
    };
  };
  GET__api_v1_me: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_044"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_042"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_me_activity: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      401: components["responses"]["resp_040"];
      403: components["responses"]["resp_046"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_me_notifications: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_055"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_me_purchases: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_012"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      500: components["responses"]["resp_021"];
    };
  };
  "GET__api_v1_me_purchases_{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Id of existing purchase. */
        id: components["parameters"]["f1b9d71bc5c9d7c5d3b7d0c3e3d4faa8"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_047"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_002"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_me_wins: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_011"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      500: components["responses"]["resp_021"];
    };
  };
  "GET__api_v1_me_wins_{auction_id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Id of existing win. */
        auction_id: components["parameters"]["6d2922b757358bf49bc76b1d1dbd2d51"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_038"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_002"];
      500: components["responses"]["resp_021"];
    };
  };
  "POST__api_v1_me_wins_{auction_id}_claim": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Id of existing win. */
        auction_id: components["parameters"]["6d2922b757358bf49bc76b1d1dbd2d51"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_032"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_002"];
      422: components["responses"]["resp_043"];
      500: components["responses"]["resp_021"];
    };
  };
  POST__api_v1_password_forgot: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      202: components["responses"]["resp_064"];
      400: components["responses"]["resp_020"];
      422: components["responses"]["resp_048"];
    };
  };
  POST__api_v1_password_reset: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_003"];
      400: components["responses"]["resp_020"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
      404: components["responses"]["resp_042"];
      422: components["responses"]["resp_043"];
    };
  };
  POST__api_v1_session_refresh: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_002"];
    responses: {
      200: components["responses"]["resp_015"];
      400: components["responses"]["resp_020"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_051"];
    };
  };
  GET__api_v1_session_remaining: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_009"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      500: components["responses"]["resp_021"];
    };
  };
  POST__api_v1_signup: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_014"];
    responses: {
      201: components["responses"]["resp_004"];
      422: components["responses"]["resp_060"];
    };
  };
  POST__api_v1_stripe_webhooks: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      401: components["responses"]["resp_040"];
      403: components["responses"]["resp_046"];
      422: components["responses"]["resp_048"];
      500: components["responses"]["resp_021"];
    };
  };
  POST__api_v1_users: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: components["requestBodies"]["req_014"];
    responses: {
      201: components["responses"]["resp_004"];
      422: components["responses"]["resp_060"];
    };
  };
  GET__api_v1_wallet: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_023"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      404: components["responses"]["resp_042"];
      500: components["responses"]["resp_021"];
    };
  };
  GET__api_v1_wallet_transactions: {
    parameters: {
      query?: {
        /** @description Page number (1-indexed) */
        page?: components["parameters"]["4b8201d282702e38320140ce419db69c"];
        /** @description Page size (default 25, max 100) */
        per_page?: components["parameters"]["8b577654ea2cfd842be3fdfd02ff6509"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components["responses"]["resp_031"];
      401: components["responses"]["resp_065"];
      403: components["responses"]["resp_046"];
      500: components["responses"]["resp_021"];
    };
  };
}
