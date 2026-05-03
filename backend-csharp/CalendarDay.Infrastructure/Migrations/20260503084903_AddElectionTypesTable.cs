using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CalendarDay.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddElectionTypesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "election_types",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_election_types", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_election_types_name",
                table: "election_types",
                column: "name",
                unique: true);

            migrationBuilder.Sql(
                """
                INSERT INTO election_types (id, name) VALUES
                (1, 'Alegeri parlamentare'),
                (2, 'Alegeri parlamentare noi'),
                (3, 'Alegeri prezidențiale'),
                (4, 'Referendum'),
                (5, 'Alegeri locale generale'),
                (6, 'Alegeri locale noi'),
                (7, 'Alegeri regionale')
                ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "election_types");
        }
    }
}
