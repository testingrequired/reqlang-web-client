use clap::Parser;
use server::{Args, Error, init_server};

#[tokio::main]
async fn main() -> Result<(), Error> {
    let args = Args::parse();

    let server_port = args.port;
    let db_path = args.db;
    let open_browser_on_start = args.open.unwrap_or(true);

    let server = init_server(server_port, db_path, open_browser_on_start).await?;

    server.start(&|| {}).await
}
