using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CalendarDay.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSubdivisionsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "subdivisions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subdivisions", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_subdivisions_code",
                table: "subdivisions",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_subdivisions_name",
                table: "subdivisions",
                column: "name");

            // Inserează nomenclatorul cu subdiviziunile CEC.
            // Folosim ON CONFLICT pe `code` (index unic) ca scriptul să fie idempotent
            // (rerularea nu provoacă duplicate; doar actualizează numele dacă s-a schimbat).
            migrationBuilder.Sql(
                """
                INSERT INTO subdivisions (id, name, code, is_active, created_at_utc, updated_at_utc) VALUES
                  (gen_random_uuid(), 'Direcţiei management alegeri',                                                              'CEC(DMA)',     TRUE, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'),
                  (gen_random_uuid(), 'Direcţiei analiză şi documentare',                                                          'CEC(DAD)',     TRUE, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'),
                  (gen_random_uuid(), 'Direcţiei comunicare, relaţii publice şi mass-media',                                       'CEC(DCRPMM)',  TRUE, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'),
                  (gen_random_uuid(), 'Direcţiei juridice',                                                                        'CEC(DJ)',      TRUE, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'),
                  (gen_random_uuid(), 'Direcţiei tehnologia informaţiei şi gestionarea listelor electorale',                       'CEC(DTIGLE)',  TRUE, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'),
                  (gen_random_uuid(), 'Direcţiei financiar-economice',                                                             'CEC(DFE)',     TRUE, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'),
                  (gen_random_uuid(), 'Direcția supraveghere și control privind finanțarea partidelor politice și a campaniilor electorale', 'CEC(DSCFPPCE)', TRUE, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'),
                  (gen_random_uuid(), 'Serviciul resurse umane',                                                                   'CEC(SRU)',     TRUE, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC')
                ON CONFLICT (code) DO UPDATE SET
                  name = EXCLUDED.name,
                  updated_at_utc = NOW() AT TIME ZONE 'UTC';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "subdivisions");
        }
    }
}
