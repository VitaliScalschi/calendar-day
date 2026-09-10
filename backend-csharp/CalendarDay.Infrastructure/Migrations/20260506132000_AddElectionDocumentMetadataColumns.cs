using System;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CalendarDay.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(CalendarDayDbContext))]
    [Migration("20260506132000_AddElectionDocumentMetadataColumns")]
    public partial class AddElectionDocumentMetadataColumns : Migration
    {
        /// <summary>
        /// No-op intenționat: aceste coloane sunt create, de fapt, de migrația SyncPendingModelChanges
        /// (20260506131547) — vezi nota din AddDocumentsTableAndRegulationDocumentLink pentru context.
        /// </summary>
        protected override void Up(MigrationBuilder migrationBuilder)
        {
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
