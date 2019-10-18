---
title:  Azure SQL Elastic Pool – Moving databases across pools using PowerShell
date:  2017-01-09 00:00:17 +00:00
permalink:  "/2017/01/08/azure-sql-elastic-pool-moving-databases-across-pools-using-powershell/"
categories:
- Solution
tags:
- Automation
- Data
- PowerShell
---
<a href="assets/2017/1/azure-sql-elastic-pool-moving-databases-across-pools-using-powershell/hand-truck-564242_6401.jpg"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="hand-truck-564242_640[1]" src="assets/2017/1/azure-sql-elastic-pool-moving-databases-across-pools-using-powershell/hand-truck-564242_6401_thumb.jpg" alt="hand-truck-564242_640[1]" width="240" height="240" align="right" border="0" /></a>

I’ve written a bit about Azure SQL Elastic Pool lately:  an <a href="http://vincentlauzon.com/2016/12/18/azure-sql-elastic-pool-overview/">overview</a>, about <a href="http://vincentlauzon.com/2016/12/21/azure-sql-elastic-pool-arm-templates/">ARM template</a> and about <a href="http://vincentlauzon.com/2017/01/04/azure-sql-elastic-pool-database-size/">database size</a>.

One of the many great features of Azure SQL Elastic Pool is that like Azure SQL Database (standalone), we can change the eDTU capacity of the pool “on the fly”, without downtime.

Unlike its standalone cousin though, we can’t change the <strong>edition</strong> of the pool.  The edition is either Basic, Standard or Premium.  It is set at creation and is immutable after that.

If we want to change the edition of a pool, the obvious way is to create another pool, move the databases there, delete the original, recreate it with a different edition and move the databases back.

This article shows how to do that using PowerShell.

You might want to move databases around for other reasons, typically to optimize the density and performance of pools.  You would then use a very similar script.
<h2>Look at the pool</h2>
Let’s start with the pools we established with <a href="http://vincentlauzon.com/2016/12/21/azure-sql-elastic-pool-arm-templates/">the sample ARM template of a previous article</a>.

From there we can look at the pool <em>Pool-A</em> using the following PowerShell command:

[code language="PowerShell"]

$old = Get-AzureRmSqlElasticPool -ResourceGroupName DBs -ElasticPoolName Pool-A -ServerName pooldemoserver

$old

[/code]

We can see the pool current edition is <em>Standard</em> while its Data Transaction Unit (DTU) count is 200.

<a href="assets/2017/1/azure-sql-elastic-pool-moving-databases-across-pools-using-powershell/image20.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="assets/2017/1/azure-sql-elastic-pool-moving-databases-across-pools-using-powershell/image_thumb20.png" alt="image" width="640" height="359" border="0" /></a>
<h2>Create a temporary pool</h2>
We’ll create a temporary pool, aptly named <em>temporary</em>, attached to the same server:

[code language="PowerShell"]

$temp = New-AzureRmSqlElasticPool -ResourceGroupName DBs -ElasticPoolName Temporary -ServerName pooldemoserver -Edition $old.Edition -Dtu $old.Dtu

$temp

[/code]

It’s important to create a pool that will allow the databases to be moved into.  The maximum size of a database is dependent of the edition and number of DTU of the elastic pool.  The easiest way is to create a pool with the same edition / DTU and this is what we do here by referencing the <strong>$old</strong> variable.
<h2>Move databases across</h2>
First, let’s grab the databases in the original pool:

[code language="PowerShell"]

$dbs = Get-AzureRmSqlDatabase -ResourceGroupName DBs -ServerName pooldemoserver | where {$_.ElasticPoolName -eq $old.ElasticPoolName}

$dbs | select DatabaseName

[/code]

<em>ElasticPoolName</em> is a property of a database.  We’ll simply change it by <em>setting</em> each database:

[code language="PowerShell"]

$dbs | foreach {Set-AzureRmSqlDatabase -ResourceGroupName DBs -ServerName pooldemoserver -DatabaseName $_.DatabaseName -ElasticPoolName $temp.ElasticPoolName}

[/code]

That command takes longer to run as the databases have to move from one compute to another.
<h2>Delete / Recreate pool</h2>
We can now delete the original pool.  It’s important to note that we wouldn’t have been able to delete a pool with databases in it.

[code language="PowerShell"]

Remove-AzureRmSqlElasticPool -ResourceGroupName DBs -ElasticPoolName $old.ElasticPoolName -ServerName pooldemoserver

$new = New-AzureRmSqlElasticPool -ResourceGroupName DBs -ElasticPoolName $old.ElasticPoolName -ServerName pooldemoserver -Edition Premium -Dtu 250

[/code]

The second line recreates it with <em>Premium</em> edition.  We could keep the original DTU, but it’s not always possible since different editions support different DTU values.  In this case, for instance, it wasn’t possible since 200 DTUs isn’t supported for Premium pools.

If you execute those two commands without pausing in between, you will likely receive an error.  It is one of those cases where the Azure REST API returns and the resource you asked to be removed seems to be removed but you can’t really recreate it back yet.  An easy work around consist in pausing or retrying.
<h2>Move databases back</h2>
We can then move the databases back to the new pool:

[code language="PowerShell"]

$dbs | foreach {Set-AzureRmSqlDatabase -ResourceGroupName DBs -ServerName pooldemoserver -DatabaseName $_.DatabaseName -ElasticPoolName $new.ElasticPoolName}

Remove-AzureRmSqlElasticPool -ResourceGroupName DBs -ElasticPoolName $temp.ElasticPoolName -ServerName pooldemoserver

[/code]

In the second line we delete the temporary pool.  Again, this takes a little longer to execute since databases must be moved from one compute to another.
<h2>Summary</h2>
We showed how to move databases from a pool to another.

The pretext was a change in elastic pool edition but we might want to move databases around for other reasons.

In practice you might not want to move your databases twice to avoid the duration of the operation and might be happy to have a different pool name.  In the demo we did, the move took less than a minute because we had two empty databases.  With many databases totaling a lot of storage it would take much more time to move those.