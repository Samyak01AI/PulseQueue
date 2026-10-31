"""
Indexed Min-Heap: Custom Data Structure for O(log N) Priority Queue with O(1) Key Lookup

Complexity:
- Peek: O(1)
- Push / Insert: O(log N)
- Pop Root (Minimum): O(log N)
- Decrease/Increase Key (Indexed Update): O(log N)
- Delete Arbitrary Element: O(log N)
- Rebuild (Floyd's Algorithm): O(N)
- Contains / Lookup: O(1)
"""
from typing import List, Tuple, Dict, Optional, Any


class IndexedMinHeap:
    """
    (key, pid) heap supporting O(log N) updates via position tracking table.
    
    Attributes:
        data: List of (key, pid) tuples where key is numeric (lower is higher priority)
        pos: Dict[int, int] mapping pid -> current index in data array
    """
    def __init__(self):
        self.data: List[Tuple[float, int]] = []
        self.pos: Dict[int, int] = {}

    def __len__(self) -> int:
        return len(self.data)

    def is_empty(self) -> bool:
        return len(self.data) == 0

    def contains(self, pid: int) -> bool:
        return pid in self.pos

    def get_key(self, pid: int) -> Optional[float]:
        if pid in self.pos:
            return self.data[self.pos[pid]][0]
        return None

    def _swap(self, i: int, j: int) -> None:
        self.data[i], self.data[j] = self.data[j], self.data[i]
        self.pos[self.data[i][1]] = i
        self.pos[self.data[j][1]] = j

    def _sift_up(self, i: int) -> None:
        while i > 0:
            parent = (i - 1) // 2
            if self.data[parent] <= self.data[i]:
                break
            self._swap(i, parent)
            i = parent

    def _sift_down(self, i: int) -> None:
        n = len(self.data)
        while 2 * i + 1 < n:
            left = 2 * i + 1
            right = left + 1
            smallest = left
            if right < n and self.data[right] < self.data[left]:
                smallest = right
            if self.data[i] <= self.data[smallest]:
                break
            self._swap(i, smallest)
            i = smallest

    def push_or_update(self, pid: int, key: float) -> None:
        """
        If pid already exists in heap, update its key in O(log N) time.
        Otherwise insert a new (key, pid) in O(log N) time.
        """
        if pid in self.pos:
            idx = self.pos[pid]
            old_val = self.data[idx]
            self.data[idx] = (key, pid)
            if self.data[idx] < old_val:
                self._sift_up(idx)
            else:
                self._sift_down(idx)
        else:
            idx = len(self.data)
            self.data.append((key, pid))
            self.pos[pid] = idx
            self._sift_up(idx)

    def pop(self) -> Optional[int]:
        """
        Removes and returns the PID with the minimum key in O(log N) time.
        Returns None if heap is empty.
        """
        if not self.data:
            return None
        root = self.data[0]
        last = self.data.pop()
        del self.pos[root[1]]
        if self.data:
            self.data[0] = last
            self.pos[last[1]] = 0
            self._sift_down(0)
        return root[1]

    def peek(self) -> Optional[Tuple[float, int]]:
        """Returns the minimum (key, pid) in O(1) without removal."""
        return self.data[0] if self.data else None

    def remove(self, pid: int) -> bool:
        """Removes an arbitrary PID from the heap in O(log N) time."""
        if pid not in self.pos:
            return False
        idx = self.pos[pid]
        last = self.data.pop()
        del self.pos[pid]
        if idx < len(self.data):
            self.data[idx] = last
            self.pos[last[1]] = idx
            self._sift_up(idx)
            self._sift_down(idx)
        return True

    def rebuild(self, pairs: List[Tuple[int, float]]) -> None:
        """
        Constructs the heap from a list of (pid, key) tuples in O(N) using Floyd's algorithm.
        """
        self.data = [(key, pid) for pid, key in pairs]
        self.pos = {pid: i for i, (_, pid) in enumerate(self.data)}
        for i in range(len(self.data) // 2 - 1, -1, -1):
            self._sift_down(i)

    def to_sorted_list(self) -> List[Tuple[float, int]]:
        """Returns a copy of elements sorted by priority key without destroying the heap."""
        # Clone heap and pop all
        clone = IndexedMinHeap()
        clone.data = list(self.data)
        clone.pos = dict(self.pos)
        res = []
        while not clone.is_empty():
            entry = clone.peek()
            clone.pop()
            if entry:
                res.append(entry)
        return res

