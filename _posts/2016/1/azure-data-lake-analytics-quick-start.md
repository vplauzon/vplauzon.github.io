---
title: Azure Data Lake Analytics Quick Start
date: 2016-01-03 16:00:14 -08:00
permalink: /2016/01/03/azure-data-lake-analytics-quick-start/
categories:
- Solution
tags:
- Big Data
---
<b><i>UPDATE (19-01-2016):  Have a look at <a href="http://vincentlauzon.com/about/azure-data-lake/"><b><i>Azure Data Lake series </i></b></a><b><i>for more posts on Azure Data Lake.</i></b></i></b>

<a href="http://vincentlauzon.com/2015/09/30/azure-data-lake-early-look/">Azure Data Lake</a> (both <a href="https://azure.microsoft.com/en-us/services/data-lake-store/" target="_blank">Storage</a> &amp; <a href="https://azure.microsoft.com/en-us/services/data-lake-analytics/" target="_blank">Analytics</a>) has been in public preview for a month or two.

It already has surprisingly good documentation:
<ul>
	<li><a href="https://azure.microsoft.com/en-us/documentation/articles/data-lake-analytics-u-sql-get-started/" target="_blank">Overview of U-SQL</a> ; walks you through diverse scenarios, ramping you up quickly</li>
	<li><a href="https://msdn.microsoft.com/en-us/library/azure/mt591959.aspx" target="_blank">U-SQL Language Reference</a> ; this is full-on details, including the context-free grammar expression of the language!</li>
</ul>
<a href="/assets/posts/2016/1/azure-data-lake-analytics-quick-start/hadoop-azure-logo-new_55d1639c1.jpg" rel="attachment wp-att-1261"><img class="size-full wp-image-1261 alignleft" src="/assets/posts/2016/1/azure-data-lake-analytics-quick-start/hadoop-azure-logo-new_55d1639c1.jpg" alt="Hadoop-Azure-Logo-New_55D1639C[1]" width="299" height="300" /></a>Azure Data Lake Analytics (ADLA) is a really great technology.  It combines the power of Hadoop with the simplicity of the like of Azure SQL Azure.  It’s super productive and easy to use while still being pretty powerfull.

At the core of this productivity is a new language:  U-SQL.  USQL is based on <a href="http://www.vldb.org/pvldb/1/1454166.pdf" target="_blank">SCOPE</a>, an internal (Microsoft) / research language and aims at unifying the declarative power of SQL with the imperative capacity of C#.

I like to call it <strong>Hive for .NET developers</strong>.

It's the ultimately managed Hadoop:  you submit U-SQL &amp; the number of processing unit you want it to run it on and that's it.  No cluster to configure, no patching, no nodes to take up or down, etc.  .  Nodes are provisioned for you to run your script and returned to a pool afterwards.

I would recommend it for the following scenarios:
<ul>
	<li>Exploration of data sets:  load your data in and start running ad hoc queries on to learn what your data is made of</li>
	<li>Data processing:  process (or pre-process) your data into a shape useful for Machine Learning, reporting, search or online algorithms</li>
</ul>
I thought I would kick some posts about more complex scenarios to display what’s possibile with that technology.

I won’t cover the basics-basics, so please read the <a href="https://azure.microsoft.com/en-us/documentation/articles/data-lake-store-get-started-portal/" target="_blank">Logistic / Get Started</a> articles.