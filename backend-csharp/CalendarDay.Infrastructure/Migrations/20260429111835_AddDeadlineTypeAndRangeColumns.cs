using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CalendarDay.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDeadlineTypeAndRangeColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "EndDate",
                table: "Deadlines",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "StartDate",
                table: "Deadlines",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Deadlines",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "SINGLE");

            migrationBuilder.Sql(
                """
                UPDATE "Deadlines" d
                SET
                    "Type" = CASE
                        WHEN src.cnt > 1 THEN 'MULTIPLE'
                        WHEN src.r IS NOT NULL THEN 'RANGE'
                        ELSE 'SINGLE'
                    END,
                    "StartDate" = CASE
                        WHEN src.cnt > 1 THEN NULL
                        WHEN src.r IS NOT NULL THEN TO_DATE(src.r[1], 'DD/MM/YYYY')
                        ELSE d."DeadlineDate"
                    END,
                    "EndDate" = CASE
                        WHEN src.cnt > 1 THEN NULL
                        WHEN src.r IS NOT NULL THEN TO_DATE(src.r[2], 'DD/MM/YYYY')
                        ELSE d."DeadlineDate"
                    END
                FROM (
                    SELECT
                        d2."Id",
                        REGEXP_MATCH(
                            COALESCE(d2."AdditionalInfo", ''),
                            '\[\[RANGE:([0-9]{1,2}/[0-9]{1,2}/[0-9]{4})\s*-\s*([0-9]{1,2}/[0-9]{1,2}/[0-9]{4})\]\]'
                        ) AS r,
                        COALESCE(dc.cnt, 0) AS cnt
                    FROM "Deadlines" d2
                    LEFT JOIN (
                        SELECT "DeadlineId", COUNT(*) AS cnt
                        FROM deadline_dates
                        GROUP BY "DeadlineId"
                    ) dc ON dc."DeadlineId" = d2."Id"
                ) AS src
                WHERE d."Id" = src."Id";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "Deadlines");

            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "Deadlines");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Deadlines");
        }
    }
}
