using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CalendarDay.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncPendingModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "DocumentId",
                table: "Regulations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentContentType",
                table: "Elections",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentOriginalName",
                table: "Elections",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "DocumentSizeBytes",
                table: "Elections",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentStoredName",
                table: "Elections",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DocumentUploadedAtUtc",
                table: "Elections",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "documents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginalName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    StoredName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RelativeUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_documents", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Regulations_DocumentId",
                table: "Regulations",
                column: "DocumentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Regulations_documents_DocumentId",
                table: "Regulations",
                column: "DocumentId",
                principalTable: "documents",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Regulations_documents_DocumentId",
                table: "Regulations");

            migrationBuilder.DropTable(
                name: "documents");

            migrationBuilder.DropIndex(
                name: "IX_Regulations_DocumentId",
                table: "Regulations");

            migrationBuilder.DropColumn(
                name: "DocumentId",
                table: "Regulations");

            migrationBuilder.DropColumn(
                name: "DocumentContentType",
                table: "Elections");

            migrationBuilder.DropColumn(
                name: "DocumentOriginalName",
                table: "Elections");

            migrationBuilder.DropColumn(
                name: "DocumentSizeBytes",
                table: "Elections");

            migrationBuilder.DropColumn(
                name: "DocumentStoredName",
                table: "Elections");

            migrationBuilder.DropColumn(
                name: "DocumentUploadedAtUtc",
                table: "Elections");
        }
    }
}
