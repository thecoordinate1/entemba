
import { createClient } from '@/lib/supabase/server' 
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = cookies() 
  const supabase = createClient(cookieStore)

  // Assuming 'todos' table exists and rows have 'id' and 'name' (or similar text field) properties
  // If your table has different columns, adjust 'select()' accordingly e.g. select('id, title')
  const { data: todos, error } = await supabase.from('todos').select('id, name')

  if (error) {
    console.error("Error fetching todos:", error);
    // Optionally, render an error message to the user
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Todos from Supabase</h1>
      {error && <p className="text-red-500">Error fetching todos: {error.message}</p>}
      <ul className="list-disc pl-5">
        {todos?.map((todo: { id: string; name: string }) => ( 
          <li key={todo.id} className="mb-2 p-2 border rounded shadow-sm">
            {todo.name || 'Untitled Todo'}
          </li> 
        ))}
        {(!todos || todos.length === 0) && !error && (
          <li className="text-muted-foreground">No todos found. Create some in your Supabase table!</li>
        )}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">
        This is a test page to demonstrate Supabase integration. 
        Ensure you have a 'todos' table with 'id' (uuid or int) and 'name' (text) columns in your Supabase project.
      </p>
    </div>
  )
}
