---
title:  Full Outer Join with LINQ to objects
date:  2014-01-28 15:46:55 -05:00
permalink:  "/2014/01/28/full-outer-join-with-linq-to-objects/"
categories:
- Solution
tags:
- .NET
---
Quite a few times it happened to me to be looking for a way to perform a full outer join using LINQ to objects.

To give a general enough example of where it is useful, I would say 'sync'. If you want to synchronize two collections (e.g. two collections of employees), then an outer join gives you a nice collection to work with.

Basically, a full outer join returns you a collection of pairs. Every time you have both items in the pair, you are facing an update: i.e. the item was present in both collections so you need to update it to synchronize. If only the first item of the pair is available, you have a creation while if only the second item is you have a delete (I'm saying first and second, but it actually really depends on how you formulated the query but you get the meaning).

Whatever the reason (a sync is the best example I could find), here is the best way I found to do it. It is largely inspired on an <a href="http://stackoverflow.com/questions/5489987/linq-full-outer-join">answer I found on stack overflow</a>.

<code>public static IEnumerable&lt;TResult&gt; FullOuterJoin&lt;TOuter, TInner, TKey, TResult&gt;(

this IEnumerable&lt;TOuter&gt; outer,

IEnumerable&lt;TInner&gt; inner,

Func&lt;TOuter, TKey&gt; outerKeySelector,

Func&lt;TInner, TKey&gt; innerKeySelector,

Func&lt;TOuter, TInner, TResult&gt; resultSelector,

IEqualityComparer&lt;TKey&gt; comparer)

{

if (outer == null)
{

throw new ArgumentNullException("outer");

}

if (inner == null)

{

throw new ArgumentNullException("inner");

}

if (outerKeySelector == null)

{

throw new ArgumentNullException("outerKeySelector");

}

if (innerKeySelector == null)

{

throw new ArgumentNullException("innerKeySelector");

}

if (resultSelector == null)

{

throw new ArgumentNullException("resultSelector");

}

if (comparer == null)

{

throw new ArgumentNullException("comparer");

}

var innerLookup = inner.ToLookup(innerKeySelector);

var outerLookup = outer.ToLookup(outerKeySelector);

var allKeys = (from i in innerLookup select i.Key).Union(

from o in outerLookup select o.Key,

comparer);

var result = from key in allKeys

from innerElement in innerLookup[key].DefaultIfEmpty()

from outerElement in outerLookup[key].DefaultIfEmpty()

select resultSelector(outerElement, innerElement);

return result;

}</code>

So here it is and it works.

You can easily optimize the signature by specializing for special cases (e.g. bumping the comparer, considering two collections of the same type hence requiring only one key selector, etc.).

For performance, I didn't bother… but I wonder if creating those two lookups isn't actually slower than doing a cross product (double loop) over both collection items and checking for key equality. My gut feeling is that it's probably wasteful for small collections, worth it for big ones, hence if you optimize it, you do it for small collection which do not have performance problem anyway.

Enjoy!