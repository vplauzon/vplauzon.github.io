---
title:  Azure SQL Datawarehouse
date:  07/26/2015 23:00:33
permalink:  "/2015/07/26/azure-sql-datawarehouse/"
categories:
- Solution
tags:
- Data
---
Documentation on <a href="http://azure.microsoft.com/en-us/services/sql-data-warehouse/" target="_blank">Azure SQL Datawarehouse</a>, the new Azure Datawarehouse managed service, is quite thin.

The <a href="http://azure.microsoft.com/en-us/documentation/services/sql-data-warehouse/" target="_blank">online documentation</a>, as of today (24/07/2015), consists of 3 videos and a blog post.

Here is what I gathered.

<a href="assets/2015/7/azure-sql-datawarehouse/db1.png"><img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="db[1]" src="assets/2015/7/azure-sql-datawarehouse/db1_thumb.png" alt="db[1]" width="215" height="240" align="left" border="0" /></a>One of the great characteristic of the offering is the <strong>separate Storage &amp; Compute billing</strong>.

You can indeed have data crunches on periodic basis (e.g. end-of-months) and pay only for those, while keeping your data up-there at the competitive price of Azure Storage.

<strong>Compute is said to be ‘elastic’</strong>, although it isn’t automatic. You can change the number of compute horsepower associated to your Datawarehouse instance without having to rebuild it, so it’s done on the fly, very quickly.  Nevertheless, for that you need to manipulate the portal (or Powershelling it), so <strong>it's not auto-elastic on-demand</strong>.

There is a nice integration with <a href="http://azure.microsoft.com/en-us/services/data-factory/" target="_blank">Azure Data Factory</a> to import data into it.

The <strong>service already is in preview</strong>, you  can access it on the <em>new portal</em>.
Azure SQL Datawarehouse looks very promising although the documentation available is slim at this point in time.

The most details I found was actually through <a href="http://bit.ly/1Ifuveh" target="_blank">SQL Server Evolution</a> video which is a nice watch.