using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CalendarDay.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddElectionDocumentMetadataColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
