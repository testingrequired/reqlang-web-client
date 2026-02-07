use clap::Parser;
use server::{Args, DbEncryption, DbOptions, Error, InitServerOptions, init_server};

#[tokio::main]
async fn main() -> Result<(), Error> {
    let args = Args::parse();

    let server_port = args.port;
    let db_path = args.db;
    let db_rekey = args.db_encryption_rekey;
    let db_encryption = args
        .db_encryption_key
        .map(|key| DbEncryption::Encrypted(key, db_rekey))
        .unwrap_or(DbEncryption::Unencrypted);

    dbg!(&db_encryption);

    let open_browser_on_start = args.open.unwrap_or(true);

    let server = init_server(InitServerOptions {
        port: server_port,
        open_browser: open_browser_on_start,
        db_options: DbOptions {
            path: db_path,
            encryption: db_encryption,
        },
    })
    .await;

    match server {
        Ok(server) => server.start(&|| {}).await,
        Err(err) => {
            panic!("Failed to start server: {err}");
        }
    }
}
