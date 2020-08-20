---
title:  Change Management in a Kusto Database
permalink: /2020/08/26/change-management-kusto
image:  /assets/posts/2020/3/change-management-kusto/moving-boxes.jpg
categories:
- Solution
tags:
- Data
- Operation
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/3/change-management-kusto/moving-boxes.jpg" />

Let's say you've setup an [Azure Data Explorer](/2020/02/19/azure-data-explorer-kusto) cluster.  You've also setup real time ingestion pipeline.  If you haven't, take a look at the [Real Time Lab I've put together](https://github.com/vplauzon/real-time-lab), where you're going to build pipelines and query data in real time.

Now this has been running for weeks, maybe months.

You need to do a change.  Maybe you need to add a column to a table.  Maybe you need to rename or change the type of a column.

How do you do that while keeping the ingestion going without dropping records?

This is what we are going to explore in this article.

As usual, [code is in GitHub](https://github.com/vplauzon/kusto/tree/master/change-management).  All scripts in this article are put together in [one script here](https://github.com/vplauzon/kusto/tree/master/change-management/sample.kql).

## Setup of a demo solution

Here we're going to setup a simple solution in a database.  In order to run the scripts, we recommend to create a separate database and run them in the context of that database.  This way, it is easy to delete the database altogether to cleanup.

First, let's create a landing table.  We suppose that table has data ingested into it in new real time, i.e. new data shows up every minute or less.

```sql
.create table invoices(EMPLOYEE_NAME:string, AMOUNT:long, DEPARTMENT_ID:int)
```

We'll then create and populate a lookup table:

```sql
.set-or-append departments <|
    datatable(id:int, department:string)
    [
        1, "Corp",
        2, "HR",
        3, "Engineering",
        4, "Sales",
        5, "Finance",
        6, "Operation"
    ]
```

Let's define a function for an update policy:

```sql
.create-or-alter function transformInvoices(){
    invoices
    | join kind=inner departments on $left.DEPARTMENT_ID==$right.id
    | project EMPLOYEE_NAME, AMOUNT, department
}
```

Using the function return schema, we can easily define the target table where the transformed data will land:

```sql
.set-or-append prettyInvoices <| transformInvoices()
    | limit 0
```

Now, let's create the update policy itself:

```sql
.alter table prettyInvoices policy update
@'[{"IsEnabled": true, "Source": "invoices", "Query": "transformInvoices", "IsTransactional": true, "PropagateIngestionProperties": true}]'
```

We note that the update policy is transactional.  This means that if the policy fails while transfering data from `invoices` to `prettyInvoices`, the data will not land in `invoices`:  it lands in both tables or in none.

Let's insert some data to see all this mechanic working:

```sql
.set-or-append invoices <|
    datatable(EMPLOYEE_NAME:string, AMOUNT:long, DEPARTMENT_ID:int)
    [
        "Bob", 5, 2,
        "Carol", 20, 2,
        "Alice", 10, 3
    ]
```

We can validate the data landed in invoices:

```sql
invoices
```

which returns:

EMPLOYEE_NAME|AMOUNT|DEPARTMENT_ID
-|-|-
Bob|5|2
Carol|20|2
Alice|10|3

Similarly,

```sql
prettyInvoices
```

returns:

EMPLOYEE_NAME|AMOUNT|department
-|-|-
Carol|20|HR
Bob|5|HR
Alice|10|Engineering

So we have our baseline ready.

Let's explore different change management scenarios.

##  Scenario 1:  adding column

We want to add a column to our table since we have more properties coming up from upstream.

Let's first clone our `invoices` table to try the changes with a safety net.

```sql
.set-or-replace invoicesClone <|
    invoices
    | limit 10
```

Let's alter that clone by adding a column.

```sql
.alter-merge table invoicesClone(approvalDuration:timespan)
```

That adds the column at the end of the table.  We can change that by reordering the columns using `.alter table`.

For that we need the entire schema.  A quick way to get that is the following:

```sql
.show table invoicesClone cslschema
```

which returns the schema

```
EMPLOYEE_NAME:string,AMOUNT:long,DEPARTMENT_ID:int,approvalDuration:timespan,
```

It is then quite easy to reorder the columns:

```sql
.alter table invoicesClone(EMPLOYEE_NAME:string, AMOUNT:long, approvalDuration:timespan, DEPARTMENT_ID:int)
```

We're pretty confident about the procedure, so, let's do it on the real table:

```sql
.alter table invoices(EMPLOYEE_NAME:string, AMOUNT:long, approvalDuration:timespan, DEPARTMENT_ID:int)
```

While we are doing that, let's simulate the continuous ingestion continuing happening:

```sql
.set-or-append invoices <|
    datatable(EMPLOYEE_NAME:string, AMOUNT:long, approvalDuration:timespan, DEPARTMENT_ID:int)
    [
        "Dany", 15, timespan(null), 4,
        "Ethan", 21, timespan(null), 3
    ]
```

If we look at the `invoices` table, we should have:

EMPLOYEE_NAME|AMOUNT|approvalDuration|DEPARTMENT_ID
-|-|-|-
Bob|5||2
Carol|20||2
Alice|10||3
Dany|15||4
Ethan|21||3

Now, let's similarly change the schema of `prettyInvoices`:

```sql
.alter table prettyInvoices(EMPLOYEE_NAME:string, AMOUNT:long, approvalDuration:timespan, department:string)
```

Again, assuming ingestion is continuing in real time:

```sql
.set-or-append invoices <|
    datatable(EMPLOYEE_NAME:string, AMOUNT:long, approvalDuration:timespan, DEPARTMENT_ID:int)
    [
        "Francine", 11, timespan(null), 5
    ]
```

Now, no extents are returned:  something is wrong.

Let's find out if there was ingestion failures:

```sql
.show ingestion failures
| where Table == "invoices" or Table == "prettyInvoices"
```

The issue is the update policy returns a result set not containing the new column:  `Query schema does not match table schema`.  Because the update policy was "transactional=true", both ingestion failed.

We can also see the `FailureKind` is `Transient`.  Since we did a `.set-or-append`, that doesn't change anything but in a real-life scenario, we would use some kind of queued ingestion (i.e. Event Hub, Event Grid, IoT Hub or any integration basedon queued ingestion).  Queued ingestion retries when transient error occur.  Those retries are attempted [a couple of times at exponential backoff period](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/updatepolicy#transactional-policy).

So we have time to do the change we need to do.  For a production scenario, those scripts should be run back-to-back and in the worse case an ingestion failure would occur and succeed on retry.

So, let's change the update policy function to include the duration column:

```sql
.create-or-alter function transformInvoices(){
    invoices
    | join kind=inner departments on $left.DEPARTMENT_ID==$right.id
    | project EMPLOYEE_NAME, AMOUNT, approvalDuration, department
}
```

Let's simulate a retry by trying to reingest the record:

```sql
.set-or-append invoices <|
    datatable(EMPLOYEE_NAME:string, AMOUNT:long, approvalDuration:timespan, DEPARTMENT_ID:int)
    [
        "Francine", 11, timespan(null), 5
    ]
```

It now returns us two extents, one for each table.

A completely new ingestion should also pass:

```sql
.set-or-append invoices <|
    datatable(EMPLOYEE_NAME:string, AMOUNT:long, approvalDuration:timespan, DEPARTMENT_ID:int)
    [
        "Gaston", 8, timespan(null), 1
    ]
```

We get the expected content:

```sql
prettyInvoices
| limit 10
```

returns:

EMPLOYEE_NAME|AMOUNT|approvalDuration|department
-|-|-|-
Carol|20||HR
Bob|5||HR
Alice|10||Engineering
Ethan|21||Engineering
Dany|15||Sales
Gaston|8||Corp
Francine|11||Finance

We can now change the upstream mapping to map the duration column.  This should send data with approval duration that we simulate here:

```sql
.set-or-append invoices <|
    datatable(EMPLOYEE_NAME:string, AMOUNT:long, approvalDuration:timespan, DEPARTMENT_ID:int)
    [
        "Hadleigh", 8, 4h, 1
    ]
```

And the `4h` (4 hours) flows to `prettyInvoices`.

The key in this scenario is to try those operations in advance and have the scripts ready.  Unfortunately, there is a little bit of timing required, although by default we have around 30 minutes which should be plenty to run a script.

##  Scenario 2:  renaming column

The team decides that having all-caps for column names is a little too 90's and want to rename EMPLOYEE_NAME and AMOUNT in prettyInvoices table.

The easiest way to "rename" a column is not to do it but have a view that does:

```sql
.create-or-alter function prettyInvoices(){
    prettyInvoices
    | project employeeName=EMPLOYEE_NAME, amount=AMOUNT, approvalDuration, department
}
```

In Kusto, functions have precedance over tables.  Also a parameterless function can omit parenthesis, so this actually is equivalent to `prettyInvoices()`:

```sql
prettyInvoices
| limit 15
```

Although that is only cosmetic, since it doesn't break anything, it often is a good enough solution.

If need be, we can change the actual schema.  This needs to be done one column at the time:

```sql
.rename column prettyInvoices.EMPLOYEE_NAME to employeeName

.rename column prettyInvoices.AMOUNT to amount
```

If we execute the following, it will fail:

```sql
prettyInvoices
```

This is because it is using the view (function) we just defined, which in turn is using the old column names.

We can force the query to tap into the table and not the view (function):

```sql
table("prettyInvoices")
```

And we see that data was preserved with the column renamed.

We can drop the view (function):

```sql
.drop function prettyInvoices
```

Now, let's see how ingestion react:

```sql
.set-or-append invoices <|
    datatable(EMPLOYEE_NAME:string, AMOUNT:long, approvalDuration:timespan, DEPARTMENT_ID:int)
    [
        "Isabel", 12, 5h, 6
    ]
```

Surprinsingly, it works, despite the update policy still referring to the old column names!

And we can see the data actually landed:

```sql
prettyInvoices
| limit 15
```

Why is that?

This is because the data insertion is done in terms of "position" of parameters, not their names.  Since columns are still in the same order, nothing breaks.

For consistency though, we'll update the function to refer to new column names:

```sql
.create-or-alter function transformInvoices(){
    invoices
    | join kind=inner departments on $left.DEPARTMENT_ID==$right.id
    | project employeeName=EMPLOYEE_NAME, amount=AMOUNT, approvalDuration, department
}
```

##  Scenario 3:  changing column type

We need to change the `amount` type from `long` to `real`.

Let's change the type of the column

```sql
.alter-merge table invoices(AMOUNT:real)
```

This should lead to an error message like this one:

![Error Change Type](/assets/posts/2020/3/change-management-kusto/error-change-type.png)

Changing the type of a column isn't supported.  We'll have to work harder.

Let's add a new column for the real type:

```sql
.alter table invoices(EMPLOYEE_NAME:string, AMOUNT:long, AMOUNT_REAL:real, approvalDuration:timespan, DEPARTMENT_ID:int)
```

If we look at the table now, we should see the column AMOUNT_REAL as empty.

We can still ingest data with the old schema:

```sql
.set-or-append invoices <|
    datatable(EMPLOYEE_NAME:string, AMOUNT:long, AMOUNT_REAL:real, approvalDuration:timespan, DEPARTMENT_ID:int)
    [
        "Jake", 23, real(null), 3h, 3
    ]
```

Let's do the changes in prettyInvoices so we can propagate:

```sql
.alter table prettyInvoices(employeeName:string, amount:long, amountReal:real, approvalDuration:timespan, department:string)
```

If we ingest now, it will fail because of update policy:

```sql
.set-or-append invoices <|
    datatable(EMPLOYEE_NAME:string, AMOUNT:long, AMOUNT_REAL:real, approvalDuration:timespan, DEPARTMENT_ID:int)
    [
        "Kamari", 13, real(null), 6h, 4
    ]
```

Let's fix the update policy:

```sql
.create-or-alter function transformInvoices(){
    invoices
    | join kind=inner departments on $left.DEPARTMENT_ID==$right.id
    | project employeeName=EMPLOYEE_NAME, amount=AMOUNT, amountReal=AMOUNT_REAL, approvalDuration, department
}
```

As we've seen in the adding column scenario, any queued ingestion would retry the failed ingestion a few times.  Let's simulate a retry here:

```sql
.set-or-append invoices <|
    datatable(EMPLOYEE_NAME:string, AMOUNT:long, AMOUNT_REAL:real, approvalDuration:timespan, DEPARTMENT_ID:int)
    [
        "Kamari", 13, real(null), 6h, 4
    ]
```

This time it works.

We can even change the mapping upstream to send us the data with real amounts:

```sql
.set-or-append invoices <|
    datatable(EMPLOYEE_NAME:string, AMOUNT:long, AMOUNT_REAL:real, approvalDuration:timespan, DEPARTMENT_ID:int)
    [
        "Larry", long(null), 43.23, 1h, 5
    ]
```

We can see the data landed in `prettyInvoices`.

As long as we have data in both columns, we could unify it in a view:

```sql
.create-or-alter function prettyInvoices(){
    prettyInvoices
    | extend mergedAmount = iif(isnull(amount), amountReal, toreal(amount))
    | project employeeName, amount=mergedAmount, approvalDuration, department
}
```

This gives us a unified view:

```sql
prettyInvoices
| limit 20
```

returns:

![Unified view](/assets/posts/2020/3/change-management-kusto/unified-view.png)

If need be we could migrate the data by re-ingesting it into a temp table.  We would then drop the original column and move the extents.

That would require us to also remove duplicates.

## Summary

