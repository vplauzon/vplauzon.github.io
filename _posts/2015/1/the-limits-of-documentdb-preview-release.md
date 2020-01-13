---
title: The limits of DocumentDB Preview Release
date: 2015-01-11 07:45:00 -08:00
permalink: /2015/01/11/the-limits-of-documentdb-preview-release/
categories:
- Solution
tags:
- NoSQL
---
<p><img style="float:left;display:inline;" src="http://www.carlosdinares.com/wp-content/uploads/2011/10/no-limits.png" align="left" />I was looking for the limits of DocumentDB Standard Tier, the only tier available during the preview release.&#160; It wasn’t all too trivial to find so here it is:</p>  <p><a title="http://azure.microsoft.com/en-us/documentation/articles/documentdb-limits/" href="http://azure.microsoft.com/en-us/documentation/articles/documentdb-limits/">http://azure.microsoft.com/en-us/documentation/articles/documentdb-limits/</a></p>  <p>Among the limits that may constrain your solution:</p>  <ul>   <li>Only 3 collections per Capacity Unit (but 100 Databases, the container of collections, per account)</li>    <li>25 stored procs (or UDFs or triggers) per collection </li>    <li>Maximum request size for documents &amp; attachments:&#160; 256 KB </li>    <li>Maximum response size:&#160; 1Mb </li>    <li>Maximum AND (and OR) per query:&#160; 5 </li> </ul>  <p>As you can see, the current limits of DocumentDB are quite aggressive.&#160; The NoSQL database is highly performing and it seems that those performance comes at a cost.</p>  <p>We can expect those limits to be loosen in the near future though.&#160; This is typical for Preview release to have sandboxed solution.&#160; The same way we can expect the product to be available in more regions.</p>