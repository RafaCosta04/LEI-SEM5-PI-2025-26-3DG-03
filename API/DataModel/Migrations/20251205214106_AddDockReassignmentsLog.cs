using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataModel.Migrations
{
    /// <inheritdoc />
    public partial class AddDockReassignmentsLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DockReassignmentLogDataModel",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TimeStamp = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    OfficerId = table.Column<long>(type: "bigint", nullable: false),
                    OriginalDockId = table.Column<long>(type: "bigint", nullable: true),
                    UpdatedDockId = table.Column<long>(type: "bigint", nullable: false),
                    VesselVisitNotificationId = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DockReassignmentLogDataModel", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DockReassignmentLogDataModel_Docks_OriginalDockId",
                        column: x => x.OriginalDockId,
                        principalTable: "Docks",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_DockReassignmentLogDataModel_Docks_UpdatedDockId",
                        column: x => x.UpdatedDockId,
                        principalTable: "Docks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DockReassignmentLogDataModel_VesselVisitNotification_VesselV~",
                        column: x => x.VesselVisitNotificationId,
                        principalTable: "VesselVisitNotification",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_DockReassignmentLogDataModel_OriginalDockId",
                table: "DockReassignmentLogDataModel",
                column: "OriginalDockId");

            migrationBuilder.CreateIndex(
                name: "IX_DockReassignmentLogDataModel_UpdatedDockId",
                table: "DockReassignmentLogDataModel",
                column: "UpdatedDockId");

            migrationBuilder.CreateIndex(
                name: "IX_DockReassignmentLogDataModel_VesselVisitNotificationId",
                table: "DockReassignmentLogDataModel",
                column: "VesselVisitNotificationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DockReassignmentLogDataModel");
        }
    }
}
