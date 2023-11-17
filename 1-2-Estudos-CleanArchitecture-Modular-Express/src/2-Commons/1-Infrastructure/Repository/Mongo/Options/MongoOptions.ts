// TODO TESTAR UNITARIAMENTE E INTREGRADOS AQUI

export class MongoOptions {
    public User!: string;
    public Password!: string;
    public Server!: string;
    public Port!: number;
    public DatabaseName!: string;

    public CreateConnection(): string {
        return `mongodb://${this.User}:${this.Password}@${this.Server}:${this.Port}/${this.DatabaseName}`;
    }
}
