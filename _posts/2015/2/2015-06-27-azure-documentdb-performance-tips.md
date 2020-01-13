---
title: Azure DocumentDB - Performance Tips
date: 2015-06-27 12:49:44 -07:00
permalink: /2015/06/27/azure-documentdb-performance-tips/
categories:
- Solution
tags:
- NoSQL
---
<a href="/assets/posts/2015/2/azure-documentdb-performance-tips/dt-improved-performance1.jpg"><img class="  wp-image-802 alignright" src="/assets/posts/2015/2/azure-documentdb-performance-tips/dt-improved-performance1.jpg?w=300" alt="dt-improved-performance[1]" width="326" height="217" /></a><a href="http://azure.microsoft.com/en-us/services/documentdb/">Azure DocumentDB</a> has been released for a little while now.  Once you get passed the usual step of how to connect and do a few hello worlds, you will want to reach for more in-depth literature.  Sooner or later, performance will be on your mind when you’ll want to take architecture decision on a solution leveraging Azure DocumentDB.

<a href="http://azure.microsoft.com/blog/author/stbaro/">Stephen Baron</a>, Program Manager on Azure DocumentDB, has published a two-parters performance tips article (<a href="http://azure.microsoft.com/blog/2015/01/20/performance-tips-for-azure-documentdb-part-1-2/">part 1</a> &amp; <a href="http://azure.microsoft.com/blog/2015/01/27/performance-tips-for-azure-documentdb-part-2/">part 2</a>).

The tips given there are quite useful and do not require to rewrite all your client code.  They cover:
<ul>
	<li>Network Optimization</li>
	<li>How to better use the SDK</li>
	<li>Indexing</li>
	<li>Query optimization</li>
	<li>Consistency settings</li>
</ul>
It is very well written, straightforward and therefore useful.  It is my reference so far.