           /* <div className="p-4 space-y-2 border-r border-gray-200 bg-gray-50 min-w-[290px]">
              {globalCTX.labels?.length ? (
                <div className="space-y-2">
                  {globalCTX.labels.map((x: string, i: number) => (
                    <div
                      key={x + i}
                      className="flex items-center justify-between bg-white px-2 py-1 rounded-lg shadow-sm"
                    >
                      <span className="text-sm font-semibold text-gray-600">{i}</span>
                      <span className="font-medium capitalize flex-1 ml-2 truncate">
                        {x}
                      </span>
                      <button
                        onClick={() => globalCTX.handleDeleteTask(globalCTX.tasks[i])}
                        className="text-red-500 hover:text-red-700"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <AddTask handleAddTask={(taskObj) => globalCTX.handleAddTask(taskObj)} />
            </div> */