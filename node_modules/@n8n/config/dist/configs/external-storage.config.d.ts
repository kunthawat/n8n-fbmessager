declare class S3BucketConfig {
    name: string;
    region: string;
}
declare class S3CredentialsConfig {
    accessKey: string;
    accessSecret: string;
}
declare class S3Config {
    host: string;
    bucket: S3BucketConfig;
    credentials: S3CredentialsConfig;
}
export declare class ExternalStorageConfig {
    s3: S3Config;
}
export {};
