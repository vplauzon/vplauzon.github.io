---
title:  Major upgrade to Azure DocumentDB LINQ provider
date:  2015-09-23 23:00:35 +00:00
permalink:  "/2015/09/23/major-upgrade-to-azure-documentdb-linq-provider/"
categories:
- Solution
tags:
- .NET
- NoSQL
---
<a href="https://vincentlauzon.files.wordpress.com/2015/08/ic7912891.png"><img class="size-full wp-image-1172 alignright" src="https://vincentlauzon.files.wordpress.com/2015/08/ic7912891.png" alt="IC791289[1]" width="450" height="306" /></a>Early Septembre 2015, <a href="http://azure.microsoft.com/en-us/blog/azure-documentdb-s-linq-provider-just-got-better/" target="_blank">Microsoft has announced a major upgrade</a> to the LINQ Provider of the .NET SDK of DocumentDb.

I know it does appear a bit confusing since when DocumentDb was released (a year ago now), it was said that it supported SQL.  Well, it supported some SQL.

Now the surface area of SQL it supports has increased.  In order for us to take advantage of this within a .NET application, the LINQ Provider must be upgraded to translate more operations into that SQL.

You see, DocumentDb's SDK works the same way than Entity Fx or LINQ to SQL or LINQ to XML in that respect:  your c# LINQ query gets translated into <a href="http://vincentlauzon.com/2011/12/16/expression-trees-blog-series/">an expression tree</a> by the compiler, then the LINQ provider (an implementation of <a href="https://msdn.microsoft.com/en-us/library/vstudio/bb351562%28v=vs.100%29.aspx?f=255&amp;MSPPError=-2147217396" target="_blank">IQueryable</a>) translates the expression tree into an SQL string (at runtime).

<a href="https://vincentlauzon.files.wordpress.com/2015/09/linq.png"><img class="alignnone size-full wp-image-1249" src="https://vincentlauzon.files.wordpress.com/2015/09/linq.png" alt="LINQ" width="481" height="85" /></a>

The SQL is what is sent to the DocumentDb service.

Today the LINQ provider allows string manipulation, array manipulation (e.g. concatenation), order by and some hierarchical manipulation too.

So download the latest <a href="https://www.nuget.org/packages/Microsoft.Azure.DocumentDB/" target="_blank">NuGet package of DocumentDb client</a> (i.e. 1.4.1) and try to expand your LINQ queries.

&nbsp;

Enjoy!