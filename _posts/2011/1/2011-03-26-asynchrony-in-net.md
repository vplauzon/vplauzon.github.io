---
title: Asynchrony in .NET
date: 2011-03-26 17:14:00 -07:00
permalink: /2011/03/26/asynchrony-in-net/
categories:
- Solution
tags:
- .NET
---
Microsoft recently released a <a href="http://www.microsoft.com/downloads/en/details.aspx?FamilyID=d7ccfefa-123a-40e5-8ed5-8d2edd68acf4&amp;displaylang=en">whitepaper</a> on the future of Asynchrony in .NET along with a <a href="http://www.microsoft.com/downloads/en/details.aspx?FamilyID=18712f38-fcd2-4e9f-9028-8373dc5732b2&amp;displaylang=en">CTP SDK</a>.

This CTP attempts to address one concern:  how to make asynchrony easy in .NET by removing all the friction in code.

In .NET, Asynchrony, so far, as been treated with the pattern <em>BeginXYZ</em> / <em>EndXYZ</em> dynamic duo.  For instance, in the <a href="http://msdn.microsoft.com/en-us/library/system.web.ui.page.aspx">System.Web.UI.Page</a> class, you can either use the synchronous <a href="http://msdn.microsoft.com/en-us/library/system.web.ui.page.processrequest.aspx">ProcessRequest</a> or the asynchronous pair <a href="http://msdn.microsoft.com/en-us/library/system.web.ui.page.asyncpagebeginprocessrequest.aspx">AsyncPageBeginProcessRequest</a> / <a href="http://msdn.microsoft.com/en-us/library/system.web.ui.page.asyncpageendprocessrequest.aspx">AsyncPageEndProcessRequest</a>.

This pattern works.  It does deliver the goods and if you implement it throughout your code, you’ll rip the benefits of scalability (in that your threads won’t be blocked waiting for IO work) given by asynchrony.  This work will also come with a slight side-effect:  your code will be very hard to read and debug.  The reason, and it is very well explained in the whitepaper, is that this pattern disrupt the control flow.

The basic reason is that when you use this pattern, you work with call backs.  Instead of having one method, you have two:  one invoking the asynchronous work, the other one being called back once the asynchronous work is done.

To use an example given in the whitepaper, here is your synchronous code:
<table class="MsoTableGrid" style="border-collapse:collapse;margin-left:5.75pt;" border="0" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="width:473.75pt;background:#eaf1dd;padding:3.6pt 5.75pt;" width="632" valign="top">
<pre><span style="font-family:consolas;color:blue;" lang="EN-US">public</span><span style="font-family:consolas;" lang="EN-US"> <span style="color:blue;">int</span> SumPageSizes(<span style="color:#2b91af;">IList</span>&lt;<span style="color:#2b91af;">Uri</span>&gt; uris)
</span><span style="font-family:consolas;" lang="EN-US">{
     <span style="color:blue;">int</span> total = 0;

     <span style="color:blue;">foreach</span> (<span style="color:blue;">var</span> uri <span style="color:blue;">in</span> uris)
     {
         statusText.Text = <span style="color:blue;">string</span>.Format(<span style="color:#a31515;">"Found {0} bytes ..."</span>, total);

         <span style="color:blue;">var</span> data = <span style="color:blue;">new</span> <span style="color:#2b91af;">WebClient</span>().DownloadData(uri);
         total += data.Length;
     }
     statusText.Text = <span style="color:blue;">string</span>.Format(<span style="color:#a31515;">"Found {0} bytes total"</span>, total);

     <span style="color:blue;">return</span> total;
}</span></pre>
</td>
</tr>
</tbody>
</table>
versus the asynchronous version (on download data):
<table class="MsoTableGrid" style="border-collapse:collapse;margin-left:5.75pt;" border="0" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="width:473.75pt;background:#eaf1dd;padding:3.6pt 5.75pt;" width="632" valign="top">
<pre><span style="font-family:consolas;color:blue;" lang="EN-US">public</span><span style="font-family:consolas;" lang="EN-US"> <span style="color:blue;">void</span> SumPageSizesAsync(<span style="color:#2b91af;">IList</span>&lt;<span style="color:#2b91af;">Uri</span>&gt; uris)
{
     SumPageSizesAsyncHelper(uris.GetEnumerator(), 0);
}

<span style="color:blue;">private</span> <span style="color:blue;">void</span> SumPageSizesAsyncHelper(<span style="color:#2b91af;">IEnumerator</span>&lt;<span style="color:#2b91af;">Uri</span>&gt; enumerator, <span style="color:blue;">int</span> total)
{
     <span style="color:blue;">if</span> (enumerator.MoveNext())
     {
         statusText.Text = <span style="color:blue;">string</span>.Format(<span style="color:#a31515;">"Found {0} bytes ..."</span>, total);

         <span style="color:blue;">var</span> client = <span style="color:blue;">new</span> <span style="color:#2b91af;">WebClient</span>();

         client.DownloadDataCompleted += (sender, e) =&gt;
         {
             SumPageSizesAsyncHelper(enumerator, total + e.Result.Length);
         };
         client.DownloadDataAsync(enumerator.Current);
     }
     <span style="color:blue;">else
    </span> {
         statusText.Text = <span style="color:blue;">string</span>.Format(<span style="color:#a31515;">"Found {0} bytes total"</span>, total);
         enumerator.Dispose();
     }
}</span></pre>
</td>
</tr>
</tbody>
</table>
Another great example of the complexity emerging from a simply control flow when put in asynchrony is this MSDN article on Asynchronous pages in ASP.NET 2.0:

<a title="http://msdn.microsoft.com/en-us/magazine/cc163725.aspx" href="http://msdn.microsoft.com/en-us/magazine/cc163725.aspx">http://msdn.microsoft.com/en-us/magazine/cc163725.aspx</a>

So basically, the pattern exists but it’s so convoluted that its usage isn’t widespread.  Now what are the consequences?

Well, efficiency mostly.  It means that every time you need to access an external resources (File, DB, Web Service), you use a thread to wait for that resource to come back to you.  You basically burn gas.

Enters the new asynchrony pattern.  Let’s take the previous example (from the whitepaper), with the new async language support:
<table class="MsoTableGrid" style="border-collapse:collapse;margin-left:5.75pt;" border="0" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="width:473.75pt;background:#eaf1dd;padding:3.6pt 5.75pt;" width="632" valign="top">
<pre><span style="font-family:consolas;color:blue;" lang="EN-US">public</span><span style="font-family:consolas;" lang="EN-US"> <span style="background:yellow;color:blue;">async</span><span style="color:blue;"> </span><span style="background:yellow;color:#2b91af;">Task</span><span style="background:yellow;">&lt;</span><span style="color:blue;">int</span><span style="background:yellow;">&gt;</span> SumPageSizes<span style="background:yellow;">Async</span>(<span style="color:#2b91af;">IList</span>&lt;<span style="color:#2b91af;">Uri</span>&gt; uris)
{
     <span style="color:blue;">int</span> total = 0;

     <span style="color:blue;">foreach</span> (<span style="color:blue;">var</span> uri <span style="color:blue;">in</span> uris)
     {
         statusText.Text = <span style="color:blue;">string</span>.Format(<span style="color:#a31515;">"Found {0} bytes ..."</span>, total);
         <span style="color:blue;">var</span> data = <span style="background:yellow;color:blue;">await</span><span style="color:blue;"> new</span> <span style="color:#2b91af;">WebClient</span>().DownloadData<span style="background:yellow;">Async</span>(uri);
         total += data.Length;
     }
     statusText.Text = <span style="color:blue;">string</span>.Format(<span style="color:#a31515;">"Found {0} bytes total"</span>, total);

     <span style="color:blue;">return</span> total;
}</span></pre>
</td>
</tr>
</tbody>
</table>
Wow, that looks awfully the same as the synchronous version, doesn’t it?  What are the differences?  Well, they are already highlighted.

The key:  <em>async</em> &amp; <em>await</em> keywords.  Those are new language construct.  Remember .NET 2.0 <em>yield</em> keyword?  Think of it as something similar, because your friendly compiler is going to work as hard with the new keywords!

Basically, it means that this method isn’t just returning the total as it seems to do, it returns a <em>task</em> (a .NET 4.0 class representing an asynchronous piece of work) returning an integer.

The compiler will tear the method apart to basically let the start of the method until the await execute synchronously and the rest as a call back.  Better yet, it does so by capturing the synchronization context of the original thread and execute each bit of the method on that synchronization context.

There is much more to say about what those keywords are doing, but I would just duplicate what is written in the whitepaper.  I just wanted to tease in order to read it, so go on and <a href="http://www.microsoft.com/downloads/en/details.aspx?FamilyID=d7ccfefa-123a-40e5-8ed5-8d2edd68acf4&amp;displaylang=en">read it</a>!