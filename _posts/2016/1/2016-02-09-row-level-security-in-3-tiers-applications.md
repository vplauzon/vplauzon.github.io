---
title: Row Level Security in 3-tiers applications
date: 2016-02-09 11:40:07 -08:00
permalink: /2016/02/09/row-level-security-in-3-tiers-applications/
categories:
- Solution
tags:
- Data
- Security
---
<a href="https://msdn.microsoft.com/en-us/library/dn765131.aspx" target="_blank">Row-Level Security</a> is a great new feature in SQL.  It is already available in Azure SQL Database and will be available in SQL Server 2016.

This is Cloud-First for you.

Row-Level Security allows you to forbid a user to see and/or access data they shouldn’t be able to see.  Traditionally this is implemented at the application level, for instance by adding where-clause to queries.  This is always risky since you must code-review every queries / commands to make sure no security holes made it in production.  Row-Level Security allows you to push that concern to the database in a much simpler and robust way.

Lots of material describe Row Level Security as a feature allowing to block access to some rows to <em>some users</em>.  The corollary to this assumption is that in order to use it, you need to connect to your database using different users.  This in turns brings a plethora of architectural problems:  should I create a database user for each security profile?  how will I scale now that I have many different connection strings?  should I try to aggregate my security profile in the name of scale?

One spot where this would hurt is 3-tier architecture.  In a 3-tier architecture, the middle tier access the data tier using its own unique user.  So would Row Level Security be useless in the context of 3-tiers applications?

In fact, Row Level Security is a much richer feature.  In this article I’ll explore it a little bit, focussing on how you would use it in a 3-tier architecture.
<h2>Predicate based Access</h2>
We’ll explore the feature, but let me break two misconceptions:
<ul>
	<li>We do not “tag” table rows with given users</li>
	<li>In general the feature isn’t limited to on / off for a given user or user group</li>
</ul>
Row Level Security uses predicates to implement access:  filter predicates (for SELECT, UPDATE &amp; DELETE) and block predicates (for after/before insert/update/delete).

A predicate is essentially a WHERE-clause appended to every subsequent queries and commands (writes).

In the predicate, we can put anything we want:  the identity of the user, the value of a column, joining another table, invoking a function, etc.  .
<h2>SESSION_CONTEXT</h2>
So we can start with the user ID and explore all the database if needs be in predicates.  But we still start with the current user, don’t we?

Well we do not have to.  A new feature, again available in Azure SQL Database &amp; coming in SQL 2016, allows us to inject end-user profile information in the ambient session.

This is the <a href="https://msdn.microsoft.com/en-us/library/mt590806.aspx" target="_blank">SESSION_CONTEXT</a> feature.  Basically the session context is a bag of properties that lives with the current logical session.

It can be manipulated with the system stored procedure <a href="https://msdn.microsoft.com/en-us/library/mt605113.aspx" target="_blank">sp_set_session_context</a> and can later be access with the SESSION_CONTEXT object:

[code language="sql"]

EXEC sp_set_session_context 'user_department_id', 42;

SELECT SESSION_CONTEXT(N'user_department_id');

[/code]

So you can see that this feature alone unlocks 3-tiers scenarios.  If you can inject information in the SESSION_CONTEXT shortly after creating your SQL connection, then you can use that information in the security predicates.

You can manipulate the SESSION_CONTEXT whenever you want but typically, for security profile, you are likely to set it at the beginning of a session and not touching it afterwards.  In those cases, you can use the <em>@readonly</em> parameter on sp_set_session_context.  This protects your application against SQL injection:  even if a malicious user manages to inject SQL, they won’t be able to alter the user security profile.
<h2>Block Predicates</h2>
I just wanted to explain why the two types of predicates, i.e. filter and block, overlap in the commands they work with, i.e. UPDATE &amp; DELETE.

Basically, the filter predicates dictate what the user can see.  The rows that don’t match a filter predicate aren’t visible (SELECT) and won’t show up for UPDATE or DELETE either (a similar error to updating a non-existing row would be thrown for instance).

This completely protects the data for reading scenario but only partially for writing scenarios.  For instance, you can still insert data that you shouldn’t be able to see.  You could also update a row you can currently see into a row you won’t be able to see.

This is where block predicates come in.  They enable blocking operations based on either before or after data.  This allows you to block an update where the after-state wouldn’t be visible to the current user, for instance.
<h2>Conclusion</h2>
Row Level Security is a great feature to implement robust access control at the database level.

With SESSION_CONTEXT you can inject user profile information in the ambient session which can be used by filter &amp; block predicates to implement row level security, hence enabling 3-tiers architecture to leverage that feature.

There is an <a href="https://channel9.msdn.com/Shows/Data-Exposed/Row-Level-Security-Updates" target="_blank">excellent video on Channel 9 explaining and demoing that feature</a> you can watch.