using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CalendarDay.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSubdivisionIdToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "subdivision_id",
                table: "Users",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_subdivision_id",
                table: "Users",
                column: "subdivision_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_subdivisions_subdivision_id",
                table: "Users",
                column: "subdivision_id",
                principalTable: "subdivisions",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_subdivisions_subdivision_id",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_subdivision_id",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "subdivision_id",
                table: "Users");
        }
    }
}
