---
title: Azure Key Vault & SQL Server Connector Update
date: 2015-10-07 16:00:23 -07:00
permalink: /2015/10/07/azure-key-vault-sql-server-connector-update/
categories:
- Solution
tags:
- Data
- Security
---
<a href="/assets/posts/2015/4/azure-key-vault-sql-server-connector-update/enhance-data-protection1.png"><img class="size-full wp-image-1272 alignleft" src="/assets/posts/2015/4/azure-key-vault-sql-server-connector-update/enhance-data-protection1.png" alt="enhance-data-protection[1]" width="230" height="160" /></a><a href="http://azure.microsoft.com/en-us/services/key-vault/" target="_blank">Azure Key Vault</a> is alive and well!

The Azure service allowing you to <a href="http://vincentlauzon.com/2015/02/03/azure-key-vault/">store keys and secrets</a> in a secured container has <a href="http://vincentlauzon.com/2015/07/09/azure-key-vault-is-now-generally-available/">been released at the end of summer</a> and it continues to improve.

The SQL Server Connector is a component that can be installed on SQL Server (not SQL Azure at this point).  It allows you to use the encryption features of SQL, i.e. Transparent Data Encryption (TDE), Column Level Encryption (CLE) &amp; Encrypted Backup, while managing the encryption keys with Azure Key Vault.

This component now <a href="http://blogs.technet.com/b/kv/archive/2015/09/08/sql_2d00_connector_2d00_updates.aspx" target="_blank">gets an upgrade</a>!

On top of fixing bugs and getting rid of dependencies to the preview REST API (that will be discontinued at the end of September 2015), it improves its error-handling of the Azure Key Vault:
<ul>
	<li>Better logs for you to see what happened</li>
	<li>Better handling of transient error on the Azure Key Vault</li>
</ul>
Indeed, all Cloud Services have transient error and every clients should be robust enough to live with it.

&nbsp;

You can download the SQL Connector <a href="https://msdn.microsoft.com/en-us/library/dn198405.aspx" target="_blank">here</a>.