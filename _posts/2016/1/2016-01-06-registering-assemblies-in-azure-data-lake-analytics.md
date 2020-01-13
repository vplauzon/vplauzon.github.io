---
title: Registering assemblies in Azure Data Lake Analytics
date: 2016-01-06 16:00:39 -08:00
permalink: /2016/01/06/registering-assemblies-in-azure-data-lake-analytics/
categories:
- Solution
tags:
- Big Data
---
<b><i>UPDATE (19-01-2016):  Have a look at <a href="http://vincentlauzon.com/about/azure-data-lake/"><b><i>Azure Data Lake series </i></b></a><b><i>for more posts on Azure Data Lake.</i></b></i></b>

<a href="http://vincentlauzon.com/2015/09/30/azure-data-lake-early-look/" target="_blank">Azure Data Lake</a> (both <a href="https://azure.microsoft.com/en-us/services/data-lake-store/" target="_blank">Storage</a> &amp; <a href="https://azure.microsoft.com/en-us/services/data-lake-analytics/" target="_blank">Analytics</a>) has been in public preview for a month or two.

You can get started by <a href="http://vincentlauzon.com/2016/01/03/azure-data-lake-analytics-quick-start/">reading this</a>.

I thought I would kick some posts about more complex scenarios to display what’s possibile with that technology.

In this post I’ll write about how to register assemblies in Azure Data Lake Analytics (ADLA).

This one took me quite a while to figure out, no thanks to the beta state of the tooling.
<h2>The problem</h2>
Let’s start with the problem.  Let’s say we need to have some C# custom code and share it among multiple USQL scripts.

I’m talking about “complex code”, not inline C# code you insert within a USQL script.  The following is inline C#:

[code lang="sql"]
SELECT
Line.Split('|')[0]
FROM @lines
[/code]

Here we simply call the <em>string.Split</em> method inline a select statement within a USQL script.  This is “complex code” called in USQL:

[code lang="sql"]
SELECT
MyNamespace.MyClass.MyMethod(Line)
FROM @lines
[/code]

where, of course, <em>MyNamespace.MyClass.MyMethod</em> is defined somewhere.

Inline code works perfectly well and is well supported.  For complex code, you need to register assemblies and this is where the fun begins.

Now you’ll often need to go with complex code because inline code is a bit limited.  You can’t instantiate object and hold references to them in U-SQL right now.  So inline code really is that:  inline method call.

I’ll show you different approaches available and tell you about their shortcomings.

Keep in mind that this is based on the public preview and that I write those lines early January 2016.  Very likely, a lot if not all those shortcomings will disapear in future releases.
<h2>Code behind</h2>
The easiest way to do complex code is to use the code-behind a script.

<a href="/assets/posts/2016/1/registering-assemblies-in-azure-data-lake-analytics/image1.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2016/1/registering-assemblies-in-azure-data-lake-analytics/image_thumb1.png" alt="image" width="367" height="70" border="0" /></a>

This should look familiar to you if you’ve done any Visual Studio with ASP.NET, WPF, Win Forms and other stacks.

In the code-behind you can author classes &amp; methods and invoke those in the U-SQL script.

Now when you submit your script, Visual Studio performs some magic on your behalf.  To see that magic, let’s look at an example:

[code lang="sql"]
@lines =
EXTRACT Line string
FROM &quot;/Marvel/vert1.txt&quot;
USING Extractors.Text(delimiter : '$');

@trans =
SELECT Mynamespace.MyClass.Hello(Line)
FROM @lines;

OUTPUT @trans
TO &quot;bla&quot;
USING Outputters.Csv();
[/code]

This is a tad ceremonious, but you need to have an output for a script to be valid and it’s easier to take an input than create one from scratch.  Anyhow, the important part is the invocation of the <em>Hello</em> method.  Now here’s the code behind:

[code lang="Csharp"]
namespace MyNamespace
{
	public static class MyClass
	{
		public static string Hello(string s)
		{
			return &quot;Hello &quot; + s;
		}
	}
}
[/code]

Now if you submit that script as a job and look at the generated script, by clicking at the bottom left “Script link” in the job tab:

<a href="/assets/posts/2016/1/registering-assemblies-in-azure-data-lake-analytics/image2.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2016/1/registering-assemblies-in-azure-data-lake-analytics/image_thumb2.png" alt="image" width="327" height="480" border="0" /></a>

You’ll see the script submitted to the ADLA engine:

[code lang="sql"]
// Generated Code Behind Header
CREATE ASSEMBLY [__codeBehind_gv215f0m.00i] FROM 0x4D5A900003000...;
REFERENCE ASSEMBLY [__codeBehind_gv215f0m.00i];

// Generated Code Behind Header
@lines =
EXTRACT Line string
FROM &quot;/Marvel/vert1.txt&quot;
USING Extractors.Text(delimiter : '$');

@trans =
SELECT Mynamespace.MyClass.Hello(Line)
FROM @lines;

OUTPUT @trans
TO &quot;bla&quot;
USING Outputters.Csv();
// Generated Code Behind Footer
USE DATABASE [master];
USE SCHEMA [dbo];

DROP ASSEMBLY [__codeBehind_gv215f0m.00i];
// Generated Code Behind Footer
[/code]

You see that a few lines were added.  Basically, the script is augmented to register an assembly and to drop it (delete it) at the end of the script.

The assembly is registered by emitting its byte-code inline in hexadecimal.  A bit crude, but it seems to work.

Now this works well but it as a few limitations:
<ol>
	<li>You can’t share code between scripts:  only the code-behind a given script is emitted in the registered assembly.  So this solution isn’t good to share code accross scripts.</li>
	<li>The assembly is available only for the duration of your script.  This is fine if you want to invoke so C# code on queries for instance.  On the other hand, if you want to create, say, a USQL function using C# code and invoke that function in another script, that will fail.  The way the runtime works, your assembly would be required by the time the calling script gets executed.  But since the script creating the function would register and then drop the assembly, that assembly wouldn’t be around later.</li>
</ol>
So if this solution works for your requirements:  use it.  It is by far the simplest available.
<h2>Visual Studio Register Assembly menu option</h2>
Create a library project, i.e. a <em>Class Library (For U-SQL Application)</em> template.

<a href="/assets/posts/2016/1/registering-assemblies-in-azure-data-lake-analytics/image3.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2016/1/registering-assemblies-in-azure-data-lake-analytics/image_thumb3.png" alt="image" width="1209" height="490" border="0" /></a>

This allows you to create code independant of scripts.  Right click on the project and select the last option on the menu.

<a href="/assets/posts/2016/1/registering-assemblies-in-azure-data-lake-analytics/image4.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2016/1/registering-assemblies-in-azure-data-lake-analytics/image_thumb4.png" alt="image" width="519" height="332" border="0" /></a>

This will pop up a dialog with a few options.

<a href="/assets/posts/2016/1/registering-assemblies-in-azure-data-lake-analytics/image5.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2016/1/registering-assemblies-in-azure-data-lake-analytics/image_thumb5.png" alt="image" width="1054" height="947" border="0" /></a>

Now be careful and always click the “Replace assembly if it already exists” option, otherwise you can only create it once.

Select which ADLA account and which DB you want the assembly to be registered in and submit the job.

Again, if you look at the script submitted to ADLA, it looks like this:

[code lang="sql"]
USE DATABASE [master];
DROP ASSEMBLY IF EXISTS [XYZ];
CREATE ASSEMBLY [XYZ] FROM 0x4D5A90000300000004000000FFFF0000…
[/code]

So the assembly is registered independant of other scripts on your behalf.  This is done again by emitting the assembly’s byte-code inline.

The major inconvenience with this method is that you need to register it manually as oppose to just recompile.
<h2>Registering it manually</h2>
Now, let’s go hard core.  We’ve seen how Visual Studio does it, why can’t we do the same?

Well, not exactly the same unless you want to input the byte-code in hexadecimal.

If you look at the <a href="https://msdn.microsoft.com/en-us/library/azure/mt621364.aspx" target="_blank">documentation</a> we can see there is another way to register an assembly:  by refering the dll in the Azure storage:

[code lang="sql"]
USE DATABASE Marvel;
DROP ASSEMBLY IF EXISTS XYZ;
CREATE ASSEMBLY XYZ FROM &quot;&lt;my location&gt;&quot;;
[/code]

Now the major drawbacks of this approach are
<ol>
	<li>You have to do it manually, in the sense it doesn’t happend automatically when you compile.</li>
	<li>You need to compile your libary and upload the dlls into the storage and then submit the registring script.</li>
	<li>If you change the files in the storage, it doesn’t change the assembly used by the scripts.  You need to drop &amp; re-create the assembly.</li>
</ol>
<h2>Conclusion / My Recommendations</h2>
I would say at the moment, with the current tooling, there is no perfect solution.  So I would recommend the solutions we explored in given contexts.
<ol>
	<li>Inline C#
<ul>
	<li>By far the simplest and better supported</li>
	<li>Use if you can do with inline and do not need to share accross scripts</li>
</ul>
</li>
	<li>Code Behind
<ul>
	<li>Use if you do not need to share accross scripts</li>
	<li>Use if your C# code is only called in your script and won’t be called by other scripts via function or procedure you create in your script</li>
</ul>
</li>
	<li>Visual Studio Register Assembly option
<ul>
	<li>Use if you need to share accross scripts</li>
	<li>Use if you do not need to integrate into auto build and do not mind the manual process</li>
</ul>
</li>
	<li>Manual Registering
<ul>
	<li>Use if you need to share accross scripts</li>
	<li>Use if you need to integrate in your continuous build system</li>
	<li>Consider automating the process by have tasks copying the assembly to the storage and submitting the assembly registering automatically as part of the build process</li>
</ul>
</li>
</ol>
So those are my recommendations.  Let me know if you have any comments / questions!