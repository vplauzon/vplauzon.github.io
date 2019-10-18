---
title:  Profile of MSN Health and Fitness on Azure DocumentDB
date:  2014-10-14 03:06:18 +00:00
permalink:  "/2014/10/13/profile-of-msn-health-and-fitness-on-azure-documentdb/"
categories:
- Solution
tags:
- NoSQL
---
<p>We <a href="http://vincentlauzon.wordpress.com/2014/09/08/azure-documentdb-first-use-cases/">already know</a> that Azure DocumentDB was used in the back-end of OneNote.  Last week Microsoft released <a href="http://azure.microsoft.com/blog/2014/10/09/azure-documentdb-profile-of-msn-health-and-fitness-2/">another nice case study</a>:  the user profiles for MSN portal.
</p><p>The requirements for the solution were:
</p><ol><li>Scale requirements to support +425M unique MSN users with +100M direct authenticated users. Initial capacity requirements for 20TB of document storage.
</li><li>Under 15ms write latency and single digit read latencies for 99% requests.
</li><li>Authorization scopes across the same underlying data.
</li><li>Schema free storage with rich query and transaction support.
</li><li>Data model extensions to support the diverse set of verticals schemas.
</li><li>Hadoop based analytics on top of the data.
</li><li>Available globally to serve all MSN markets and users.
</li></ol><p>Here we see the typical requirements leading to a NoSQL solution:
</p><ul><li>Data volume
</li><li>Read / Write performance
</li><li>Schema free
</li></ul><p>On top of those typical requirements, Azure DocumentDB offers the atypical rich querying without pre-configuration.
</p><p>Look at this case study.  You might recognize some pattern in a solution you are working on.  If that is so, you might want to look into <a href="http://azure.microsoft.com/en-us/documentation/services/documentdb/">Azure DocumentsDB</a>.</p>