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
    [Migration("20260506124500_AddDocumentsTableAndRegulationDocumentLink")]
    public partial class AddDocumentsTableAndRegulationDocumentLink : Migration
    {
        /// <summary>
        /// No-op intenționat: tabelul "documents" + coloana Regulations.DocumentId sunt create, de fapt,
        /// de migrația SyncPendingModelChanges (20260506131547) — generată corect de `dotnet ef` puțin mai
        /// târziu, tocmai pentru că această migrație nu era pe atunci recunoscută de EF (îi lipsea
        /// atributul [Migration]) și modelul a fost re-detectat ca "neaplicat". Odată adăugat atributul,
        /// dacă am reface aici crearea, am intra în conflict "already exists" cu SyncPendingModelChanges
        /// pe orice bază de date nouă. Migrația rămâne în istoric doar ca să păstreze ordinea cronologică.
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
