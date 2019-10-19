---
title: How to copy and backup SQL Databases in Azure
date: 2016-02-10 16:34:29 -05:00
permalink: /2016/02/10/how-to-copy-and-backup-sql-databases-in-azure/
categories:
- Solution
tags:
- Data
---
Let’s say you want a copy of your database for some reasons.  Scenarios might vary.  Maybe you want to bring back production DB to another environment.

There are at least three ways I could think to do that with the Azure Portal:
<ul>
	<li>Copy the Database</li>
	<li>Restore a version of the Database</li>
	<li>Backup / Restore the current Database</li>
</ul>
<h2>Copy the Database</h2>
This option is quite straightforward.  We will copy the current state of the database into a new database.

In the portal, go to your database blade and press the copy button on top.

<a href="/assets/2016/2/how-to-copy-and-backup-sql-databases-in-azure/image5.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/2016/2/how-to-copy-and-backup-sql-databases-in-azure/image_thumb5.png" alt="image" width="829" height="222" border="0" /></a>

In the <em>Copy</em> blade, type the name of the new database &amp; choose which logical server it should be attached to.  Press OK.

This will create a copy of the database.

The copy will be of the same pricing tier as the original.  This can be changed afterwards using the portal.

The copy will be in the same resource group as the original.  This can be changed afterwards using PowerShell scripts.
<h2>Restore a version of the Database</h2>
Azure SQL Database are automatically backed up in the background in order to create <em>Point in time Restore</em>.

Depending on <a href="https://azure.microsoft.com/en-us/documentation/articles/sql-database-business-continuity/" target="_blank">your pricing tier</a>, you can go back different length of time.  For instance, standard tier allows you to go back 14 days.

So again, go to your Database blade.  Click the restore button.

<a href="/assets/2016/2/how-to-copy-and-backup-sql-databases-in-azure/image6.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/2016/2/how-to-copy-and-backup-sql-databases-in-azure/image_thumb6.png" alt="image" width="835" height="206" border="0" /></a>

Type a database name for the target (copy) and choose a point in time.  Click Ok.

The copy will be in the same logical server, the same resource group and have the same pricing tier as the source.
<h2>Backup / Restore the current Database</h2>
This option can be interesting if you want to keep a copy of the backup for multiple restore (e.g. maybe you are testing a script), you want to carry the database easily across subscription or you want to restore it on-premise.

In your database blade, click Export.

<a href="/assets/2016/2/how-to-copy-and-backup-sql-databases-in-azure/image7.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/2016/2/how-to-copy-and-backup-sql-databases-in-azure/image_thumb7.png" alt="image" width="842" height="190" border="0" /></a>

The target will be a file in blob storage.  You’ll need to specify the name of the file, the location (storage account and container) and the login information of an admin account on the logical SQL Server.  Click ok.

Once the DB is exported you can use it to restore it somewhere.

In order to do that, open your SQL Server blade and click <em>Import Database</em>.

<a href="/assets/2016/2/how-to-copy-and-backup-sql-databases-in-azure/image8.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/2016/2/how-to-copy-and-backup-sql-databases-in-azure/image_thumb8.png" alt="image" width="561" height="172" border="0" /></a>

From there you’ll specify where to source the backup file, on which logical SQL Server to create the database, with which collation and the name of the DB.
<h2>Conclusion</h2>
As you can see, Azure SQL Database lets you copy its content in many ways.

One of the most interesting way is the point in time recovery.  This is interesting because it allows you to easily go back in time.

Since Azure SQL Database is triple redundant, chances are you’ll never have to perform a disaster recovery on it (unless the Azure Region you selected gets flooded or falls victim of an earthquake).  So point in time recovery, or OUPS recovery, is what you’ll use.