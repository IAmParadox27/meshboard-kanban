using Meshboard.Core.Domain;
using Microsoft.EntityFrameworkCore;

namespace Meshboard.Infrastructure.Database
{
    public class MeshboardDbContext : DbContext
    {
        public MeshboardDbContext(DbContextOptions<MeshboardDbContext> options)
            : base(options)
        {
        }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>();
            modelBuilder.Entity<UserExternalLogin>()
                .HasOne(x => x.User)
                .WithMany(x => x.ExternalLogins)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            modelBuilder.Entity<SourceDefinition>();

            modelBuilder.Entity<BoardDefinition>();

            modelBuilder.Entity<BoardSourceDefinition>()
                .HasOne(x => x.Board)
                .WithMany()
                .HasForeignKey(x => x.BoardId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BoardSourceDefinition>()
                .HasOne(x => x.Source)
                .WithMany()
                .HasForeignKey(x => x.SourceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BoardIssueAssignment>()
                .HasOne(x => x.Board)
                .WithMany()
                .HasForeignKey(x => x.BoardId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BoardIssueAssignment>()
                .HasOne(x => x.Source)
                .WithMany()
                .HasForeignKey(x => x.SourceId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}