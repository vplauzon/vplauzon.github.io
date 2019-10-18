---
title:  SQL Azure & ACID Transactions: back to 2001
date:  2010-11-30 02:00:00 +00:00
permalink:  "/2010/11/29/sql-azure-acid-transactions-back-to-2001/"
categories:
- Solution
tags:
- Data
---
I meant to write about this since I read about it a little <a href="http://blogs.msdn.com/b/sqlazure/archive/2010/07/19/10039859.aspx">back in July</a>, today is the day.

<a href="assets/2010/11/sql-azure-acid-transactions-back-to-2001/image3.png"><img style="display:inline;margin-left:0;margin-right:0;border:0;" title="image" src="assets/2010/11/sql-azure-acid-transactions-back-to-2001/image_thumb3.png" border="0" alt="image" width="244" height="71" align="right" /></a> You know I love <a href="http://www.microsoft.com/en-us/sqlazure/default.aspx">Microsoft SQL Azure</a>.

The technology impressed me when it was released.  Until then Azure contained only <a href="http://www.microsoft.com/windowsazure/windowsazure/">Azure storage</a>.  Azure Storage is a great technology if you plan to be the next e-Bay on the block and shove billions of transactions a day to your back-end.  If you’re interested into migrating your enterprise application or host your mom &amp; pop transactional web site in the cloud, it’s both an overkill in terms of scalability and a complete paradigm shift.  The latter frustrated a lot of early adopter.  A few months later, Microsoft replied by releasing SQL Azure.  I was impressed.

Not only did they listen to feedback but they worked around the clock to release quite a nice product.  SQL Azure isn’t just an SQL Server hosted in the cloud.  It’s totally self managed.  SQL Azure hosts 3 copies of your data in redundancy, so it’s totally resilient to hardware failures and maintenance:  like the rest of Azure it’s build with failure in mind as being part of life and dealt with by the platform.  Also, SQL Azure is trivial to provision:  just log to Windows Azure portal and click new SQL Azure…

This enables a lot of very interesting scenarios.  For instance, if you need to stage data once a month and don’t have to capacity in-house, go for it, you’re gona pay only for the time the DB is on-line.  You can easily <a href="https://datasync.sqlazurelabs.com/SADataSync.aspx">sync it</a> with other SQL Azure DB and soon you’re gona be able to run reporting in the cloud with it.  It’s a one stop shop, you pay for use, you don’t need to buy a license for SQL Server nor for Windows Server running underneath.

Now that is all nice and you might think, let’s move everything there!  Ok, it’s currently limited to 50Gb which is a show stopper for some enterprise applications and certainly a lot of e-Commerce applications, but that leaves a lot of scenarios addressed by it.

A little caveat I wanted to talk to you about today is…  its <a href="http://msdn.microsoft.com/en-us/library/ee336245.aspx#ts">lack of distributed transaction support</a>.

Of course, that makes sense.  An SQL Azure DB is a virtual service.  You can imagine that bogging down those services with locks wouldn’t scale very well.  Plus, it’s not because two SQL Azure instances resides in your account that they reside on the same servers.  So supporting distributed transactions would lead to quite a few issues.

Now most of you are probably saying to themselves:  “who cares, I hate those MS-DTS transactions requiring an extra port to be open anyway and I never use it”.  Now you might not use that but you might have become accustomed to using .NET Framework (2.0 and above) class <a href="http://msdn.microsoft.com/en-us/library/system.transactions.transactionscope.aspx">System.Transactions.TransactionScope</a>.  This wonderful component allows you to write code with the following elegant pattern:
<blockquote>using(scope=new TransactionScope())
{

//  Do DB operations

scope.Commit();
}</blockquote>
This pattern allows you to declaratively manage your transactions, committing them and rolling back if an exception is thrown.

Now…  that isn’t supported in SQL Azure!  How come?  Well, yes you’ve been using it with SQL Server 2005 &amp; 2008 without ever needing <a href="http://en.wikipedia.org/wiki/Distributed_Transaction_Coordinator">Microsoft Distributed Transaction Service</a> (MS DTS) but maybe you didn’t notice it but you were actually using a feature introduced in SQL Server 2005:  upgradable transaction.  This allows SQL Server 2005 to start a transaction as a light transaction on one DB and if need be, with time, to upgrade it to a distributed transaction on more than one transactional resources (e.g. another SQL Server DB, an MSMQ queue or what have you).

When your server doesn’t support upgradable transactions (e.g. SQL Server 2000), when you use <a href="http://msdn.microsoft.com/en-us/library/system.transactions.transactionscope.aspx">System.Transactions.TransactionScope</a>, it opens a distributed transaction right away.

Well, SQL Azure doesn’t support upgradable transactions (presumably because they have nothing to upgrade to), so when your code will run, it will try to open a distributed transaction and will blow.

Microsoft recommendation?  Use light transaction and manage them manually using <a href="http://msdn.microsoft.com/en-us/library/86773566.aspx">BeginTransaction</a> and <a href="http://msdn.microsoft.com/en-us/library/system.data.sqlclient.sqltransaction.commit.aspx">Commit</a> &amp; <a href="http://msdn.microsoft.com/en-us/library/zayx5s0h.aspx">Rollback</a> on the returned <a href="http://msdn.microsoft.com/en-us/library/system.data.sqlclient.sqltransaction.aspx">SqlTransaction</a> object.  Hence the title:  back to 2001.

Now, it depends what you do.  If you’re like a vast majority of developers (and even some architect) and you think that <a href="http://en.wikipedia.org/wiki/ACID">ACID transactions</a> is related to <a href="http://en.wikipedia.org/wiki/Lsd">LSD</a>, then you probably never manage transactions at all in your code, so this news won’t affect you too much.  If you’re aware of transaction and like me embraced <a href="http://msdn.microsoft.com/en-us/library/system.transactions.transactionscope.aspx">System.Transactions.TransactionScope</a> and sprinkled it over your code like if it was paprika on an Hungarian dish, then you might think that migrating to SQL Azure will take a little longer than an afternoon.

Now it all varies.  If you wrapped your SQL Connection creation in a factory, you might be able to pull out something a little faster.

Anyhow, I found that feature quite disappointing.  A lot of people use SQL Server light transactions and that would be (I think) relatively easy to support.  The API could blow when you try to upgrade the transaction.  I suppose this would be a little complicated since it would require a new provider for SQL Azure.  This is what I proposed today at:

<a title="http://www.mygreatwindowsazureidea.com/forums/34192-windows-azure-feature-voting/suggestions/1256411-support-transactionscope-for-light-transaction" href="http://www.mygreatwindowsazureidea.com/forums/34192-windows-azure-feature-voting/suggestions/1256411-support-transactionscope-for-light-transaction">http://www.mygreatwindowsazureidea.com/forums/34192-windows-azure-feature-voting/suggestions/1256411-support-transactionscope-for-light-transaction</a>

So please go and vote for it!